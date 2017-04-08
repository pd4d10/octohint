import * as ts from 'typescript'

const FILE_NAME = 'test.ts'

export default class Service {
  service: ts.LanguageService
  program: ts.Program
  source: ts.SourceFile

  constructor(code: string) {
    this.createService(this.formatCode(code))
  }

  formatCode(code: string) {
    // FIXME: Replace tab with 8 space, GitHub's tab size
    return code.replace(/\t/g, '        ')
  }

  createService(code: string) {
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
    this.service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
    this.program = this.service.getProgram()
    this.source = this.program.getSourceFile(FILE_NAME)
  }

  private getPosition(line: number, character: number) {
    return this.source.getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number) {
    const position = this.getPosition(line, character)
    const occurrences = this.service.getOccurrencesAtPosition(FILE_NAME, position)
    console.log('occurrences', occurrences)

    if (!occurrences) {
      return []
    }

    const data = occurrences.map(occurrence => ({
      // FIXME: isDefinition
      isWriteAccess: occurrence.isWriteAccess,
      range: this.source.getLineAndCharacterOfPosition(occurrence.textSpan.start),
      width: occurrence.textSpan.length
    }))
    return data
  }

  getDefinition(line: number, character: number) {
    const position = this.getPosition(line, character)
    const infos = this.service.getDefinitionAtPosition(FILE_NAME, position)
    console.log('infos', infos)

    if (infos && infos[0]) {
      return this.source.getLineAndCharacterOfPosition(infos[0].textSpan.start)
    } else {
      return undefined
    }
  }

  getQuickInfo(line: number, character: number) {
    const position = this.getPosition(line, character)
    const quickInfo = this.service.getQuickInfoAtPosition(FILE_NAME, position)
    console.log('quickInfo', quickInfo)

    if (!quickInfo) {
      return undefined
    }

    const info = ts.displayPartsToString(quickInfo.displayParts)
    const range = this.source.getLineAndCharacterOfPosition(quickInfo.textSpan.start)

    const data = {
      info,
      range,
      width: quickInfo.textSpan.length
    }
    return data
  }
}
