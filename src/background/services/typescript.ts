import * as ts from 'typescript'
import Service from './service'

declare var require: any

const defaultLibName = '//lib.d.ts'
const defaultLib = window.TS_LIB

export default class TSService extends Service {
  private _languageService: ts.LanguageService
  private _sourceFile: ts.SourceFile

  createService(code: string) {
    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [this.fileName],
      getScriptVersion: () => '0', // Version matters not here since no file change
      getScriptSnapshot: fileName => {
        if (fileName === defaultLibName) {
          return ts.ScriptSnapshot.fromString(defaultLib)
        }

        if (fileName === this.fileName) {
          return ts.ScriptSnapshot.fromString(code)
        }
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({
        module: ts.ModuleKind.CommonJS,
        allowJs: true,
      }),
      getDefaultLibFileName: () => defaultLibName,
      // log: console.log,
      // trace: console.trace,
      // error: console.error,
    }

    // Create the language service files
    this._languageService = ts.createLanguageService(
      servicesHost,
      ts.createDocumentRegistry()
    )
    const program = this._languageService.getProgram()
    this._sourceFile = program.getSourceFile(this.fileName)
  }

  private getPosition(line: number, character: number) {
    return this._sourceFile.getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number) {
    const position = this.getPosition(line, character)
    const references = this._languageService.getReferencesAtPosition(
      this.fileName,
      position
    )

    if (!references) return

    return references.map(reference => ({
      isWriteAccess: reference.isWriteAccess,
      range: this._sourceFile.getLineAndCharacterOfPosition(
        reference.textSpan.start
      ),
      width: reference.textSpan.length,
    }))
  }

  getDefinition(line: number, character: number) {
    const position = this.getPosition(line, character)
    const infos = this._languageService.getDefinitionAtPosition(
      this.fileName,
      position
    )

    // Sometime returns undefined
    if (!infos) return

    const infosOfFile = infos.filter(info => info.fileName === this.fileName)
    if (infosOfFile.length === 0) return

    return this._sourceFile.getLineAndCharacterOfPosition(
      infosOfFile[0].textSpan.start
    )
  }

  getQuickInfo(line: number, character: number) {
    const position = this.getPosition(line, character)
    const quickInfo = this._languageService.getQuickInfoAtPosition(
      this.fileName,
      position
    )

    // Sometime returns undefined
    if (!quickInfo) return

    // TODO: Colorize display parts
    return {
      info: ts.displayPartsToString(quickInfo.displayParts),
      range: this._sourceFile.getLineAndCharacterOfPosition(
        quickInfo.textSpan.start
      ),
      width: quickInfo.textSpan.length,
    }
  }
}
