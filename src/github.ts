// FIXME: Add types
// import gitHubInjection from 'github-injection'
declare var require: any
const gitHubInjection = require('github-injection')

import renderSwitch from './components/switch.tsx'
import renderHeader from './components/header.tsx'
import renderFooter from './components/footer.tsx'
import { debounce } from 'lodash'
import './style.css'

const DEBOUNCE_TIMEOUT = 300

// Visual studio theme
const USAGE_COLOR = 'rgba(173,214,255,.3)'
const WRITE_ACCESS_COLOR = 'rgba(14,99,156,.25)'

let option = true

function main() {
  const $content = <HTMLElement>document.querySelector('.file')

  if (!$content) {
    return
  }

  const $header = $content.querySelector('.file-header')
  const $actions = $header.querySelector('.file-actions')
  const $table = $content.querySelector('table')
  const $test = $table.querySelector('span')

  const $firstLineGutter = $table.querySelector('#L1')
  const $firstLine = $table.querySelector('#LC1')

  // Switch
  const $switch = document.createElement('div')
  $switch.className = 'btn btn-sm'
  $switch.style.marginRight = '6px'
  $switch.addEventListener('click', () => {
    header.setState({
      occurrences: [],
      isDefinitionVisible: false,
      isQuickInfoVisible: false,
    })
    option = !option
  })
  $actions.insertBefore($switch, $actions.querySelector('.BtnGroup'))
  renderSwitch($switch)

  // For occurrences and definition
  const $container = document.createElement('div')
  $header.appendChild($container)
  const header = renderHeader($container)

  const $footer = document.createElement('div')
  $content.appendChild($footer)
  const footer = renderFooter($footer)

  // Use `getBoundingClientRect` instead of `offsetWidth/Height` to get accurate width and height
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
  const FONT_WIDTH = $test.getBoundingClientRect().width / $test.innerText.length
  const FILE_HEAD_HEIGHT = $header.getBoundingClientRect().height
  const GUTTER_WIDTH = $firstLineGutter.getBoundingClientRect().width + parseInt(getComputedStyle($firstLine).paddingLeft, 10)
  const LINE_HEIGHT = $firstLine.getBoundingClientRect().height
  const LINE_WIDTH = $firstLine.getBoundingClientRect().width
  const OFFSET_TOP = $content.offsetTop + FILE_HEAD_HEIGHT

  function getPosition(e: MouseEvent, $dom: HTMLElement) {
    const rect = $dom.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - GUTTER_WIDTH) / FONT_WIDTH),
      y: Math.floor((e.clientY - rect.top) / LINE_HEIGHT)
    }
  }

  // interface DrawData {
  //   range: ts.LineAndCharacter,
  //   width: number,
  //   isWriteAccess: boolean
  // }

  const file = location.href

  chrome.runtime.sendMessage({
    file,
    type: 'service',
    data: $table.innerText,
  }, response => {
    console.log(response)

    // Show all occurrences on click
    function handleClick(e: MouseEvent) {
      if (!option) return
      const nextState = {
        occurrences: [],
        isDefinitionVisible: false
      }

      const position = getPosition(e, $table)

      chrome.runtime.sendMessage({
        file,
        type: 'occurrence',
        position,
        meta: e.metaKey,
      }, response => {
        if (response.info) {
          Object.assign(nextState, {
            isDefinitionVisible: true,
            definitionStyle: {
              height: `${LINE_HEIGHT}px`,
              width: `${LINE_WIDTH - 10}px`,
              top: `${response.info.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`,
              left: `${GUTTER_WIDTH}px`
            }
          })
          window.scrollTo(0, OFFSET_TOP + response.info.line * LINE_HEIGHT - 50)
        }

        // TODO: Fix overflow when length is large
        // TODO: Fix position when horizontal scroll
        const occurrences = response.occurrences.map(data => ({
          height: `${LINE_HEIGHT}px`,
          width: `${data.width * FONT_WIDTH}px`,
          top: `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`,
          left: `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`,
          backgroundColor: data.isWriteAccess ? WRITE_ACCESS_COLOR : USAGE_COLOR,
        }))

        Object.assign(nextState, { occurrences })

        header.setState(nextState)
      })

      // TODO: Exclude click event triggered by selecting text
      // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
      // if (window.getSelection().toString()) {
      //   return
      // }
    }
    $table.addEventListener('click', handleClick)

    // Show quick info on hover
    // FIXME: When info string is long enough, overflow to second line
    function handleMouseMove(e: MouseEvent) {
      if (!option) return

      const position = getPosition(e, $table)
      chrome.runtime.sendMessage({
        file,
        type: 'quickInfo',
        position,
      }, response => {
        const { data } = response
        if (data) {
          footer.setState({
            isVisible: true,
            info: data.info,
            style: {
              top: `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT - 22}px`,
              left: `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`,
            }
          })

          header.setState({
            style: {
              width: `${data.width * FONT_WIDTH}px`,
              top: `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`,
              left: `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`,
            },
            isVisible: true
          })
        } else {
          footer.setState({
            isVisible: false
          })

          header.setState({
            isVisible: false
          })
        }
      })
    }
    $table.addEventListener('mousemove', debounce(handleMouseMove, DEBOUNCE_TIMEOUT))

    // Hide quick info
    function handleMouseOut() {
      if (!option) return

      footer.setState({
        isVisible: false,
      })
      header.setState({
        isQuickInfoVisible: false,
      })
    }
    $table.addEventListener('mouseout', handleMouseOut)

    // Meta key
    document.addEventListener('keydown', (e) => {
      if (!option) return

      if (e.key === 'Meta') {
        $content.style.cursor = 'pointer'
      }
    })

    document.addEventListener('keyup', (e) => {
      if (!option) return

      if (e.key === 'Meta') {
        $content.style.cursor = 'default'
      }
    })
  })
}

gitHubInjection(window, (err: Error) => {
  if (err) throw err
  main()
})

// TODO: Multi language support
