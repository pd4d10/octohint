import * as ts from 'typescript'
import Service from './service'
import { debounce } from 'lodash'
import './style.css'

const FILE_NAME = 'test.ts'
const DEBOUNCE_TIMEOUT = 300

const USAGE_COLOR = 'rgba(173,214,255,.3)'
const WRITE_ACCESS_COLOR = 'rgba(14,99,156,.25)'
const QUICK_INFO_COLOR = 'rgba(173,214,255,.15)'
const DEFINITION_COLOR = 'rgb(248, 238, 199)'

let option = true

export function main() {
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
  $switch.innerHTML = 'Intelli Octo'
  $switch.style.color = option ? '' : '#aaa'
  $switch.addEventListener('click', () => {
    clear()
    option = !option
    $switch.style.color = option ? '' : '#aaa'
  })
  $actions.insertBefore($switch, $actions.querySelector('.BtnGroup'))

  // For definition
  const $definition = document.createElement('div')
  $definition.style.position = 'absolute'
  $definition.style.background = DEFINITION_COLOR
  $definition.style.visibility = 'hidden'
  $header.appendChild($definition)

  // For occurrences
  const $container = document.createElement('div')
  $header.appendChild($container)

  // For quick info
  // TODO: Extract CSS
  const $quickInfo = document.createElement('div')
  $quickInfo.style.position = 'absolute'
  $quickInfo.style.background = '#eee'
  $quickInfo.style.border = '1px solid #aaa'
  $quickInfo.style.fontSize = '12px'
  $quickInfo.style.padding = '4px'
  $quickInfo.style.lineHeight = '1'
  // $quickInfo.style.transition = 'opacity .3s'
  $quickInfo.style.fontFamily = getComputedStyle($firstLine).fontFamily
  $quickInfo.style.opacity = '0'
  $quickInfo.style.visibility = 'hidden'
  $content.appendChild($quickInfo)

  // Use `getBoundingClientRect` instead of `offsetWidth/Height` to get accurate width and height
  // https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements
  const FONT_WIDTH = $test.getBoundingClientRect().width / $test.innerText.length
  const FILE_HEAD_HEIGHT = $header.getBoundingClientRect().height
  const GUTTER_WIDTH = $firstLineGutter.getBoundingClientRect().width + parseInt(getComputedStyle($firstLine).paddingLeft, 10)
  const LINE_HEIGHT = $firstLine.getBoundingClientRect().height
  const LINE_WIDTH = $firstLine.getBoundingClientRect().width
  const OFFSET_TOP = $content.offsetTop + FILE_HEAD_HEIGHT

  // For quick info mask
  const $quickInfoMask = document.createElement('div')
  $quickInfoMask.style.position = 'absolute'
  $quickInfoMask.style.height = `${LINE_HEIGHT}px`
  $quickInfoMask.style.background = QUICK_INFO_COLOR
  $quickInfoMask.style.display = 'none'
  $header.appendChild($quickInfoMask)

  function getPosition(e: MouseEvent, $dom: HTMLElement) {
    const rect = $dom.getBoundingClientRect()
    return {
      x: Math.floor((e.clientX - rect.left - GUTTER_WIDTH) / FONT_WIDTH),
      y: Math.floor((e.clientY - rect.top) / LINE_HEIGHT)
    }
  }

  interface DrawData {
    range: ts.LineAndCharacter,
    width: number,
    isWriteAccess: boolean
  }

  function clear() {
    $container.innerHTML = ''
    $definition.style.visibility = 'hidden'
  }

  // TODO: Fix overflow when length is large
  // TODO: Fix position when horizontal scroll
  function draw(datas: DrawData[], styles: {}) {
    datas.forEach(data => {
      const $mask = document.createElement('div')

      // Set style
      $mask.style.position = 'absolute'
      $mask.style.height = `${LINE_HEIGHT}px`
      $mask.style.width = `${data.width * FONT_WIDTH}px`
      $mask.style.top = `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`
      $mask.style.left = `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`

      Object.assign($mask.style, styles)

      if (data.isWriteAccess) {
        $mask.style.backgroundColor = WRITE_ACCESS_COLOR
      }

      $container.appendChild($mask)
    })
  }

  function drawUsage(data: DrawData[]) {
    return draw(data, {
      background: USAGE_COLOR
    })
  }

  const service = new Service($table.innerText)

  // Show all occurrences on click
  function handleClick(e: MouseEvent) {
    if (!option) return
    clear()

    const position = getPosition(e, $table)
    const info = service.getDefinition(position.y, position.x)

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }

    const data = service.getOccurrences(position.y, position.x)
    drawUsage(data)

    // If Meta key is pressed, go to definition
    if (info && e.metaKey) {
      $definition.style.height = `${LINE_HEIGHT}px`
      $definition.style.width = `${LINE_WIDTH - 10}px`
      $definition.style.top = `${info.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`
      $definition.style.left = `${GUTTER_WIDTH}px`
      $definition.style.visibility = 'visible'

      window.scrollTo(0, OFFSET_TOP + info.line * LINE_HEIGHT - 50)
    }
  }
  $table.addEventListener('click', handleClick)

  // Show quick info on hover
  // FIXME: When info string is long enough, overflow to second line
  function handleMouseMove(e: MouseEvent) {
    if (!option) return

    const position = getPosition(e, $table)
    const data = service.getQuickInfo(position.y, position.x)

    if (data) {
      $quickInfo.innerHTML = data.info
      $quickInfo.style.top = `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT - 22}px`
      $quickInfo.style.left = `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`
      $quickInfo.style.opacity = '1'
      $quickInfo.style.visibility = 'visible'

      $quickInfoMask.style.width = `${data.width * FONT_WIDTH}px`
      $quickInfoMask.style.top = `${data.range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`
      $quickInfoMask.style.left = `${data.range.character * FONT_WIDTH + GUTTER_WIDTH}px`
      $quickInfoMask.style.display = 'block'
    } else {
      $quickInfo.style.opacity = '0'
      $quickInfo.style.visibility = 'hidden'

      $quickInfoMask.style.display = 'none'
    }
  }
  $table.addEventListener('mousemove', debounce(handleMouseMove, DEBOUNCE_TIMEOUT))

  // Hide quick info
  function handleMouseOut() {
    if (!option) return

    $quickInfo.style.opacity = '0'
    $quickInfoMask.style.display = 'none'
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
}
