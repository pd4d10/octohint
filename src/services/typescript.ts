import * as ts from 'typescript'
import Service from './service'

declare var require: any

const defaultLib = window.TS_LIB

export default class TSService extends Service {
  private _languageService: ts.LanguageService
  private _sourceFile: ts.SourceFile

  createService(code: string) {
    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [this.fileName],
      getScriptVersion: () => '0', // Version matters not here since no file change
      getScriptSnapshot: (fileName) => {
        if (fileName === '//lib.d.ts') {
          return ts.ScriptSnapshot.fromString(defaultLib)
        }

        if (fileName === this.fileName) {
          return ts.ScriptSnapshot.fromString(code)
        }

        return undefined
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({ module: ts.ModuleKind.CommonJS }),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      log: console.log,
      trace: console.trace,
      error: console.error,
    }

    // Create the language service files
    this._languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
    const program = this._languageService.getProgram()
    this._sourceFile = program.getSourceFile(this.fileName)
  }

  private getPosition(line: number, character: number) {
    return this._sourceFile.getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number) {
    const position = this.getPosition(line, character)
    const occurrences = this._languageService.getOccurrencesAtPosition(this.fileName, position)

    if (!occurrences) {
      return []
    }

    const data = occurrences.map(occurrence => ({
      isWriteAccess: occurrence.isWriteAccess,
      range: this._sourceFile.getLineAndCharacterOfPosition(occurrence.textSpan.start),
      width: occurrence.textSpan.length
    }))
    return data
  }

  getDefinition(line: number, character: number) {
    const position = this.getPosition(line, character)
    const infos = this._languageService.getDefinitionAtPosition(this.fileName, position) || []

    const infosOfFile = infos.filter(info => info.fileName === this.fileName)

    if (infosOfFile.length === 0) {
      return undefined
    }

    return this._sourceFile.getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
  }

  getQuickInfo(line: number, character: number) {
    const position = this.getPosition(line, character)
    const quickInfo = this._languageService.getQuickInfoAtPosition(this.fileName, position)

    if (!quickInfo) {
      return undefined
    }

    const info = ts.displayPartsToString(quickInfo.displayParts)
    const range = this._sourceFile.getLineAndCharacterOfPosition(quickInfo.textSpan.start)

    const data = {
      info,
      range,
      width: quickInfo.textSpan.length
    }
    return data
  }
}
