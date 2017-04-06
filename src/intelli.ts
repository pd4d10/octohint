import * as ts from 'typescript'
import './style.css'

// TODO: Calculate width for different fonts
const FONT_WIDTH = 7.223
const FILE_HEAD_HEIGHT = 43
const GUTTER_WIDTH = 60
const LINE_HEIGHT = 20
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
  const $container = document.querySelector('.file-header')
  $container.appendChild($mask)
}

function drawDefinition(range: ts.LineAndCharacter, width: number) {
  return draw(range, width, CLASS_NAME_DEFINITION)
}

function drawUsage(range: ts.LineAndCharacter, width: number) {
  return draw(range, width, CLASS_NAME_USAGE)
}

export function main() {
  const $dom = document.querySelector('table')
  if (!$dom) {
    return
  }

  // FIXME: Replace tab with 8 space, GitHub's tab size
  const code: string = $dom.innerText.replace(/\t/g, '        ')

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

  $dom.addEventListener('click', function (e) {
    clear()

    const position = getPosition(e, $dom)
    const pos: number = source.getPositionOfLineAndCharacter(position.y, position.x)

    const infos: ts.DefinitionInfo[] = services.getDefinitionAtPosition(FILE_NAME, pos)
    if (infos) {
      const info = infos[0]
      console.log(info)
      const range: ts.LineAndCharacter = source.getLineAndCharacterOfPosition(info.textSpan.start)

      // If meta key is pressed, go to definition
      if (e.metaKey) {
        window.location.hash = `#L${range.line + 1}`
      }

      drawDefinition(range, info.textSpan.length)
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
