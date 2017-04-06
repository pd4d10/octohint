import * as ts from 'typescript'
import './style.css'

// Add <HTMLElement> to get properties like `offsetWidth`
// https://github.com/Microsoft/TypeScript/issues/3263#issuecomment-105292587
const $content = <HTMLElement>document.querySelector('.file')

const $header = <HTMLElement>$content.querySelector('.file-header')
const $table = $content.querySelector('table')

const $test = $table.querySelector('span')

const $firstLineGutter = <HTMLElement>$table.querySelector('#L1')
const $firstLine = <HTMLElement>$table.querySelector('#LC1')

const FONT_WIDTH = $test.offsetWidth / $test.innerText.length
const FILE_HEAD_HEIGHT = $header.offsetHeight
const GUTTER_WIDTH = $firstLineGutter.offsetWidth + parseInt(getComputedStyle($firstLine).paddingLeft, 10)
const LINE_HEIGHT = $firstLine.offsetHeight
const CLASS_NAME = 'intelli-github'
const CLASS_NAME_DEFINITION = `${CLASS_NAME}-definition`
const CLASS_NAME_USAGE = `${CLASS_NAME}-usage`
const FILE_NAME = 'test.ts'

function getPosition(e: MouseEvent, $dom: HTMLElement) {
  const rect = $dom.getBoundingClientRect()
  // console.log(e.clientX, e.clientY, rect)
  return {
    x: Math.floor((e.clientX - rect.left - GUTTER_WIDTH) / FONT_WIDTH),
    y: Math.floor((e.clientY - rect.top) / LINE_HEIGHT)
  }
}

// Clear all
function clear() {
  const doms = document.querySelectorAll(`.${CLASS_NAME}`)
  ; [].forEach.call(doms, ($node: HTMLElement) => {
    $node.remove()
  })
}

// TODO: Fix overflow when length is large
function draw(range: ts.LineAndCharacter, width: number, className: string) {
  const $mask = document.createElement('div')

  // Set style
  $mask.className = `${CLASS_NAME} ${className}`
  $mask.style.width = `${width * FONT_WIDTH}px`
  $mask.style.top = `${range.line * LINE_HEIGHT + FILE_HEAD_HEIGHT}px`
  $mask.style.left = `${range.character * FONT_WIDTH + GUTTER_WIDTH}px`

  // Append
  $header.appendChild($mask)
}

function drawDefinition(range: ts.LineAndCharacter, width: number) {
  return draw(range, width, CLASS_NAME_DEFINITION)
}

function drawUsage(range: ts.LineAndCharacter, width: number) {
  return draw(range, width, CLASS_NAME_USAGE)
}

export function main() {
  if (!$table) {
    return
  }

  // FIXME: Replace tab with 8 space, GitHub's tab size
  const code: string = $table.innerText.replace(/\t/g, '        ')

  // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [FILE_NAME],
    getScriptVersion: () => '0', // Version matters not here since no file change
    getScriptSnapshot: () => ts.ScriptSnapshot.fromString(code),
    getCurrentDirectory: () => '/',
    getCompilationSettings: () => ({ module: ts.ModuleKind.CommonJS }),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  }

  // Create the language service files
  const services: ts.LanguageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
  const program: ts.Program = services.getProgram()
  const source: ts.SourceFile = program.getSourceFile(FILE_NAME)

  $table.addEventListener('click', function (e) {
    clear()

    const position = getPosition(e, $table)
    const pos: number = source.getPositionOfLineAndCharacter(position.y, position.x)

    const infos: ts.DefinitionInfo[] = services.getDefinitionAtPosition(FILE_NAME, pos)
    console.log(infos)
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

    const occurrences: ts.ReferenceEntry[] = services.getOccurrencesAtPosition(FILE_NAME, pos)
    if (occurrences) {
      occurrences.forEach(occurrence => {
        const range: ts.LineAndCharacter = source.getLineAndCharacterOfPosition(occurrence.textSpan.start)
        drawUsage(range, occurrence.textSpan.length)
      })
    }
  })
}
