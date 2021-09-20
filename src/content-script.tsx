import { render, h } from 'preact'
import { App } from './app'
import githubInject from 'github-injection'
import { slice } from 'lodash-es'

const toStyleText = (obj: { [key: string]: string | number }) => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

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
const renderToContainer = ({
  container,
  fontDom,
  tabSizeDom,
  lineHeight,
  paddingLeft,
  paddingTop,
  code,
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
  const wrapperWidth = `${containerRect.width - paddingLeft - 10}px`

  const $background = document.createElement('div')
  $background.setAttribute(
    'style',
    toStyleText({
      position: 'relative',
      // zIndex: -1, // Set z-index to -1 makes GitLab occurrence not show
      top: paddingTop + 'px',
      left: paddingLeft + 'px',
      width: wrapperWidth,
    })
  )

  const $quickInfo = document.createElement('div')
  const style = getComputedStyle(container)
  const paddingAndBorderOfContainer =
    px2num(style.paddingTop) +
    px2num(style.paddingBottom) +
    px2num(style.borderTopWidth) +
    px2num(style.borderBottomWidth)
  $quickInfo.setAttribute(
    'style',
    toStyleText({
      position: 'relative',
      width: wrapperWidth, // Important, make quick info show as wide as possible
      // zIndex: 2,
      bottom: `${containerRect.height - paddingAndBorderOfContainer - paddingTop}px`,
      left: `${paddingLeft}px`,
    })
  )

  container.insertBefore($background, container.firstChild)
  container.appendChild($quickInfo)

  render(
    <App
      {...{
        container,
        $background,
        $quickInfo,
        fontWidth: fontParams.width,
        fontFamily: fontParams.family,
        fileName,
        code,
        lineHeight,
        tabSize,
      }}
    />,
    $background
  )
}

const $ = (selector: string, wrapper: HTMLElement = document.body) => {
  return wrapper.querySelector<HTMLElement>(selector)
}
const $$ = (selector: string, wrapper: HTMLElement = document.body) => {
  return slice(wrapper.querySelectorAll<HTMLElement>(selector))
}

// Replace `//` with `/` to simulate file system path
function getFilePath(loc: { host: string; pathname: string } = location) {
  return '/' + loc.host + loc.pathname
}

function getGithubCode(container: HTMLElement) {
  return $$('tr>td:nth-child(2)', container).reduce((code, el) => {
    return code + el.innerText.replaceAll('\n', '') + '\n'
  }, '')
}

interface RenderParams {
  container: HTMLElement
  fontDom: HTMLElement
  tabSizeDom: HTMLElement
  lineWidth: number
  lineHeight: number
  paddingLeft: number
  paddingTop: number
  code: string
  fileName: string
  // TODO: This is pretty tricky for making GitLab and Bitbucket work
  beforeRender?: () => void
}

const getGithubParams = (): RenderParams | undefined => {
  const container = $('.blob-wrapper')
  const line1 = $('#LC1')
  const tabSizeDom = $('.blob-wrapper table')
  if (!container || !line1 || !tabSizeDom) return

  const rect = line1.getBoundingClientRect()
  return {
    container,
    fontDom: line1,
    tabSizeDom,
    lineWidth: rect.width,
    lineHeight: rect.height,
    paddingLeft: 60,
    paddingTop: 0,
    code: getGithubCode(container),
    fileName: getFilePath(),
  }
}

function getGithubGistParams(wrapper: HTMLElement): RenderParams | undefined {
  const container = $('.blob-wrapper', wrapper)
  const fontDom = $('.blob-wrapper .blob-code', wrapper)
  const tabSizeDom = $('.blob-wrapper table', wrapper)
  const fileInfo = $('.file-info', wrapper)
  if (!container || !fontDom || !tabSizeDom || !fileInfo) return

  return {
    container,
    fontDom,
    tabSizeDom,
    lineWidth: 918,
    lineHeight: 20,
    paddingLeft: 60,
    paddingTop: 0,
    code: getGithubCode(container),
    fileName: getFilePath().replace(/\/$/, '') + fileInfo.innerText.trim(),
  }
}

// const BitbucketRenderer: RendererParams = {
//   getContainer: () => $('.view-lines'),
//   getFontDOM: () => $('.view-lines span'),
//   getLineWidthAndHeight: () => ({
//     width: (<HTMLElement>$('.view-lines .view-line')).offsetWidth - 43,
//     height: 18,
//   }),
//   paddingLeft: 0,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/src/', '/raw/'),
//   getFileName: getFilePath,
//   // extraBeforeRender: () => (($('.file-source .code pre') as HTMLElement).style.position = 'relative'),
// }

// // This GitLab is for old version
// // TODO: New version use dynamic loading
// const GitLabRenderer: RendererParams = {
//   getContainer: () => $('.blob-content .code'),
//   getFontDOM: () => $('#LC1'),
//   getLineWidthAndHeight: () => $('#LC1')!.getBoundingClientRect(),
//   paddingLeft: 10,
//   paddingTop: 0,
//   getCodeUrl: () => getCurrentUrl().replace('/blob/', '/raw/'),
//   getFileName: getFilePath,
//   beforeRender: () => {
//     const $code = $('.blob-content .code code') as HTMLElement
//     $code.style.position = 'relative'
//     $code.style.background = 'transparent'
//   },
// }

// let prevContainer: Element | null

// // TODO:
// const addMutationObserver = (
//   container: Element | null,
//   params: RendererParams,
//   extraCondition = true,
// ) => {
//   if (!container || !extraCondition) return

//   new MutationObserver(mutations => {
//     mutations.forEach(mutation => {
//       console.log(mutation)
//       if (mutation.type === 'childList' && mutation.addedNodes.length) {
//         // This fix GitHub trigger multi mutations sometimes while dynamic loading
//         // Check if current container equals to previous, if same then ignore
//         const container = params.getContainer()
//         if (container && prevContainer !== container) {
//           renderToContainer(params)
//           prevContainer = container
//         }
//       }
//     })
//   }).observe(container, {
//     attributes: true,
//     childList: true,
//     characterData: true,
//   })
// }

const runAdapter = () => {
  // GitHub Gist
  if (location.host === 'gist.github.com') {
    const containers = $$('.js-gist-file-update-container')
    if (!containers) return
    containers.forEach((container) => {
      const params = getGithubGistParams(container as HTMLElement)
      if (params) {
        renderToContainer(params)
      }
    })
    return
  }

  // GitHub
  // TODO: Dynamic import
  // May be deployed at private domain, URL
  // So use DOM selector
  const params = getGithubParams()
  if (params) {
    githubInject(() => {
      const params = getGithubParams()
      if (params) renderToContainer(params)
    })
    return
  }

  // GitLab
  // FIXME: Use `document.documentElement` may cause problems when DOM added by other extensions
  // this.addMutationObserver(document.documentElement, GitLabRenderer, GitLabRenderer.getContainer() !== null)

  // Direct loading, like browser go back
  // renderToContainer(GitLabRenderer)
  // return

  // Bitbucket
  // Seems Bitbucket already use monaco-editor to show code
  // this.addMutationObserver($('.react-monaco-editor-container'), BitbucketRenderer)
  // if (BitbucketRenderer.getContainer()) {
  //   new Renderer(BitbucketRenderer)
  //   return
  // }
}

runAdapter()
