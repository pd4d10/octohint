import * as ts from 'typescript'
import { debounce } from 'lodash'
import './style.css'

const FILE_NAME = 'test.ts'
const DEBOUNCE_TIMEOUT = 300

export function main() {
  const $content = document.querySelector('.file')

  if (!$content) {
    return
  }

  const $header = $content.querySelector('.file-header')
  const $table = $content.querySelector('table')
  const $test = $table.querySelector('span')

  const $firstLineGutter = $table.querySelector('#L1')
  const $firstLine = $table.querySelector('#LC1')

  // For occurrences
  const $container = document.createElement('div')
  $header.appendChild($container)

  // For quick info
  const $quickInfo = document.createElement('div')
  $quickInfo.style.position = 'absolute'
  $quickInfo.style.background = '#eee'
  $quickInfo.style.border = '1px solid #aaa'
  $quickInfo.style.fontSize = '12px'
  $quickInfo.style.padding = '4px'
  $quickInfo.style.lineHeight = '1'
  $quickInfo.style.transition = 'opacity .3s'
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

  // For quick info mask
  const $quickInfoMask = document.createElement('div')
  $quickInfoMask.style.position = 'absolute'
  $quickInfoMask.style.height = `${LINE_HEIGHT}px`
  $quickInfoMask.style.background = 'rgb(173,214,255)'
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
    width: number
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

      $container.appendChild($mask)
    })
  }

  function drawDefinition(data: DrawData[]) {
    return draw(data, {
      background: 'rgb(14, 99, 156)'
    })
  }

  function drawUsage(data: DrawData[]) {
    return draw(data, {
      background: 'rgb(173, 214, 255)'
    })
  }

  // FIXME: Replace tab with 8 space, GitHub's tab size
  const code: string = $table.innerText.replace(/\t/g, '        ')

  // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [FILE_NAME],
    getScriptVersion: () => '0', // Version matters not here since no file change
    getScriptSnapshot: (fileName) => {
      return fileName === FILE_NAME ? ts.ScriptSnapshot.fromString(code) : undefined
    },
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => ({ module: ts.ModuleKind.CommonJS }),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  }

  // Create the language service files
  const service: ts.LanguageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
  const program: ts.Program = service.getProgram()
  const source: ts.SourceFile = program.getSourceFile(FILE_NAME)

  // Click event
  $table.addEventListener('click', function (e) {
    // Clear
    $container.innerHTML = ''

    const position = getPosition(e, $table)
    const pos: number = source.getPositionOfLineAndCharacter(position.y, position.x)

    const infos: ts.DefinitionInfo[] = service.getDefinitionAtPosition(FILE_NAME, pos)
    console.log('infos', infos)

    if (infos && infos.length) {
      const info = infos[0]
      const range: ts.LineAndCharacter = source.getLineAndCharacterOfPosition(info.textSpan.start)

      // If meta key is pressed, go to definition
      if (e.metaKey) {
        window.location.hash = `#L${range.line + 1}`
      }
    }

    // TODO: Exclude click event triggered by selecting text
    // https://stackoverflow.com/questions/10390010/jquery-click-is-triggering-when-selecting-highlighting-text
    // if (window.getSelection().toString()) {
    //   return
    // }

    const occurrences: ts.ReferenceEntry[] = service.getOccurrencesAtPosition(FILE_NAME, pos)
    console.log('occurrences', occurrences)

    if (occurrences) {
      const data = occurrences.map(occurrence => ({
        range: source.getLineAndCharacterOfPosition(occurrence.textSpan.start),
        width: occurrence.textSpan.length
      }))
      drawUsage(data)
    }
  })

  // Show quick info on hover
  // FIXME: When info string is long enough, overflow to second line
  function handleMouseMove(e: MouseEvent) {
    const position = getPosition(e, $table)
    const pos: number = source.getPositionOfLineAndCharacter(position.y, position.x)

    const quickInfo = service.getQuickInfoAtPosition(FILE_NAME, pos)
    console.log('quickInfo', quickInfo)

    if (quickInfo) {
      const info: string = ts.displayPartsToString(quickInfo.displayParts)
      const range: ts.LineAndCharacter = source.getLineAndCharacterOfPosition(quickInfo.textSpan.start)

      $quickInfo.innerHTML = info
      $quickInfo.style.top = `${range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT - 22}px`
      $quickInfo.style.left = `${range.character * FONT_WIDTH + GUTTER_WIDTH}px`
      $quickInfo.style.opacity = '1'
      $quickInfo.style.visibility = 'visible'

      const data: DrawData = {
        range,
        width: quickInfo.textSpan.length
      }
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

  $table.addEventListener('mouseout', e => {
    const target = <HTMLElement>e.target
    if (target.tagName === 'TD') {
      return
    }

    $quickInfo.style.opacity = '0'
  })

  // Meta key down event
  $table.addEventListener('keydown', (e) => {
    if (e.key !== 'Meta') {
      return
    }
  })
}
