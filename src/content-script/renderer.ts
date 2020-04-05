import { RenderParams } from './adapter'
import {
  MessageType,
  ContentMessage,
  BackgroundMessage,
  BackgroundMessageOfOccurrence,
  BackgroundMessageOfQuickInfo,
} from '../types'
import Background from './background.svelte'
import Foreground from './foreground.svelte'
import { debounce } from 'lodash-es'

const getFontParams = (fontDom: HTMLElement) => {
  const testDom = document.createElement('span')
  testDom.innerText = '0'
  fontDom.appendChild(testDom)

  const style = getComputedStyle(testDom)
  const result = {
    width: testDom.getBoundingClientRect().width,
    family: style.fontFamily || 'monospace',
  }

  testDom.remove()
  return result
}

const getOffsetTop = (e: HTMLElement): number => {
  if (!e) {
    return 0
  }
  const parent = e.offsetParent as HTMLElement
  return e.offsetTop + getOffsetTop(parent)
}

// '20px' => 20
const px2num = (px: string | null) => {
  if (px) {
    return parseInt(px.replace('px', ''), 10)
  } else {
    return 0
  }
}

/**
 * Principles:
 * Do not break DOM position as mush as possible
 * Like set `position` property to existing DOM
 *
 * <container>           +--------------------+
 *   - container padding top + border top
 *              +--------------------+
 *   <background />
 *  +-----------------------------
 *  |                padding top
 *  |              +-----------
 *  | padding left | Code area
 *  |              +----------
 *  |                padding bottom
 *  +-------------------------------
 *   <quickInfo />
 *               ---------------
 *   - container padding bottom + border bottom
 * </container>  +--------------------+
 *
 * Problems:
 * 1. Masks should not cover code
 * 2. Masks should not be selected
 * 3. Masks should follow Horizontal scroll
 * 4. Quick info overflow on first or second line
 *
 * DOM structure    - z-index
 *
 * <container>
 *   <background /> - 0
 *   ...            - 1
 *   <quickInfo />  - 2
 * </container>
 *
 * <container> and its childrens should not set background-color
 * Order: background -> other childrens(including code) -> quickInfo
 */
export const renderToContainer = ({
  container,
  fontDom,
  tabSizeDom,
  lineWidth,
  lineHeight,
  paddingLeft,
  paddingTop,
  codeUrl,
  fileName,
  beforeRender,
}: RenderParams) => {
  console.log('container:', container)

  const tabSize = parseInt(getComputedStyle(tabSizeDom).getPropertyValue('tab-size'), 10) || 8 // TODO: Firefox

  // Get font width and family
  const fontParams = getFontParams(fontDom)

  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  if (beforeRender) beforeRender()

  const containerRect = container.getBoundingClientRect()
  const wrapperWidth = containerRect.width - paddingLeft - 10

  const style = getComputedStyle(container)
  const paddingAndBorderOfContainer =
    px2num(style.paddingTop) +
    px2num(style.paddingBottom) +
    px2num(style.borderTopWidth) +
    px2num(style.borderBottomWidth)

  const background = new Background({
    target: container,
    anchor: container.firstChild,
    props: {
      container,
      fontWidth: fontParams.width,
      fontFamily: fontParams.family,
      fileName,
      codeUrl,
      offsetTop: getOffsetTop(container),
      lineWidth,
      lineHeight,
      paddingTop,
      paddingLeft,
      tabSize,
      wrapperWidth,
    },
  })

  const foreground = new Foreground({
    target: container,
    props: {
      container,
      fontWidth: fontParams.width,
      fontFamily: fontParams.family,
      fileName,
      codeUrl,
      offsetTop: getOffsetTop(container),
      lineWidth,
      lineHeight,
      paddingTop,
      paddingLeft,
      tabSize,
      wrapperWidth,
      bottom: containerRect.height - paddingAndBorderOfContainer - paddingTop,
    },
  })

  const DEBOUNCE_TIMEOUT = 300
  const isMacOS = /Mac OS X/i.test(navigator.userAgent)

  function isMeta(e: KeyboardEvent) {
    return isMacOS ? e.key === 'Meta' : e.key === 'Control'
  }

  // keydown: change mouse cursor to pointer
  document.addEventListener('keydown', (e) => {
    console.log('keydown', e)
    if (isMeta(e)) {
      // FIXME: Slow when file is large
      container.style.cursor = 'pointer'
      // FIXME: Sometimes keyup can't be triggered, add a long enough timeout to restore
      setTimeout(() => {
        container.style.cursor = ''
      }, 10000)
    }
  })

  // keyup: recover mouse cursor
  document.addEventListener('keyup', (e) => {
    console.log('keyup', e)
    if (isMeta(e)) {
      container.style.cursor = ''
    }
  })

  const getPosition = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    return {
      // Must be integers, so use Math.floor
      x: Math.floor((e.clientX - rect.left - paddingLeft) / fontParams.width),
      y: Math.floor((e.clientY - rect.top - paddingTop) / lineHeight),
    }
  }

  const sendMessage = async (message: ContentMessage): Promise<BackgroundMessage> => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response)
      })
    })
  }

  // click: show occurrences
  // if meta key is pressed, also show definition and scroll to it
  container.addEventListener('click', async (e) => {
    console.log('click', e)

    const position = getPosition(e)
    if (position.x < 0 || position.y < 0) {
      return
    }

    const response = (await sendMessage({
      type: MessageType.occurrence,
      file: fileName,
      position,
      meta: isMacOS ? e.metaKey : e.ctrlKey,
      codeUrl: codeUrl,
      tabSize: tabSize,
    })) as BackgroundMessageOfOccurrence

    // TODO: Fix overflow when length is large
    if (response.info) {
      background.$set({ quickInfo: response.info })
      foreground.$set({ quickInfo: response.info })
    }
    if (response.occurrences) {
      background.$set({ occurrences: response.occurrences })
    }

    if (response.info) {
      window.scrollTo(
        0,
        getOffsetTop(container) + paddingTop + response.info.line * lineHeight - 80,
      ) // TODO: Magic number
    }

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }
  })

  // mousemove: show quick info on stop
  container.addEventListener(
    'mousemove',
    debounce(async (e: MouseEvent) => {
      // console.log('mousemove', e)
      const position = getPosition(e)
      console.log(position)

      if (position.x < 0 || position.y < 0) {
        return
      }

      const { data } = (await sendMessage({
        file: fileName,
        codeUrl: codeUrl,
        type: MessageType.quickInfo,
        position,
        tabSize: tabSize,
      })) as BackgroundMessageOfQuickInfo

      if (data) {
        background.$set({ quickInfo: data })
        foreground.$set({ quickInfo: data })
      }
    }, DEBOUNCE_TIMEOUT),
  )

  // mouseout: hide quick info on leave
  container.addEventListener('mouseout', () => {
    // console.log('mouseout', e)
    background.$set({ quickInfo: null })
    foreground.$set({ quickInfo: null })
  })

  // Create service on page load
  chrome.runtime.sendMessage({
    type: MessageType.service,
    file: fileName,
    codeUrl: codeUrl,
    tabSize,
  })
}
