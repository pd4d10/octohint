import * as ts from 'typescript'
import Service from './service'

declare var require: any

const defaultLibName = '//lib.d.ts'
const defaultLib = window.TS_LIB

const types = ['jquery']

export default class TSService extends Service {
  private _languageService: ts.LanguageService
  private _sourceFile: ts.SourceFile
  // private getScriptSnapshot: (fileName: string) => string | undefined
  private libs: { [file: string]: ts.IScriptSnapshot } = {}

  getLibs(code: string) {
    const reg = /[import|export]\s*?.*?\sfrom\s*?['"](.*?)['"]/g
    const matches = code.match(reg)
    if (!matches) return []
    return matches.map(str => str.replace(reg, '$1'))
  }

  async fetchCode(libName: string) {
    const res = await fetch(
      `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`
    )
    if (res.ok) return res.text()
  }

  async createService(code: string) {
    const libs = this.getLibs(code)
    const libsCode = await Promise.all(libs.map(lib => this.fetchCode(lib)))
    libs.forEach((name, i) => {
      const code = libsCode[i]
      if (code) {
        this.libs[name] = ts.ScriptSnapshot.fromString(code)
      }
    })

    const regex = /^\/node_modules\/(.*?)\/index.d.ts$/

    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => [this.fileName, ...types.map(type => `/node_modules/${type}/index.d.ts`)],
      getScriptVersion: () => '0', // Version matters not here since no file change
      getScriptSnapshot: fileName => {
        console.log(fileName)
        if (fileName === defaultLibName) {
          return ts.ScriptSnapshot.fromString(defaultLib)
        }

        if (fileName === this.fileName) {
          return ts.ScriptSnapshot.fromString(code)
        }

        if (regex.test(fileName)) {
          const libName = fileName.replace(regex, '$1')
          return this.libs[libName]
        }
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({
        allowJs: true,
        // diagnostics: true,
        traceResolution: true,
        allowSyntheticDefaultImports: true,
      }),
      getDefaultLibFileName: () => defaultLibName,
      // getNewLine: ts.sys.newLine,
      log: console.log,
      trace: console.log,
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
    const references = this._languageService.getReferencesAtPosition(this.fileName, position)

    if (!references) return []

    return references.map(reference => ({
      isWriteAccess: reference.isWriteAccess,
      range: this._sourceFile.getLineAndCharacterOfPosition(reference.textSpan.start),
      width: reference.textSpan.length,
    }))
  }

  getDefinition(line: number, character: number) {
    const position = this.getPosition(line, character)
    const infos = this._languageService.getDefinitionAtPosition(this.fileName, position)

    // Sometime returns undefined
    if (!infos) return []

    const infosOfFile = infos.filter(info => info.fileName === this.fileName)
    if (infosOfFile.length === 0) return []

    return this._sourceFile.getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
  }

  getQuickInfo(line: number, character: number) {
    const position = this.getPosition(line, character)
    const quickInfo = this._languageService.getQuickInfoAtPosition(this.fileName, position)
    if (!quickInfo) return

    // TODO: Colorize display parts
    return {
      info: quickInfo.displayParts,
      range: this._sourceFile.getLineAndCharacterOfPosition(quickInfo.textSpan.start),
      width: quickInfo.textSpan.length,
    }
  }
}
