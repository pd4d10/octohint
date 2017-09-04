import * as ts from 'typescript'
import Service from './service'

declare var require: any

const defaultLibName = '//lib.d.ts'
const defaultLib = window.TS_LIB

const types = ['jquery']

export default class TSService extends Service {
  private _languageService: ts.LanguageService
  private _program: ts.Program
  // private _sourceFile: ts.SourceFile
  // private getScriptSnapshot: (fileName: string) => string | undefined
  private libs: { [file: string]: ts.IScriptSnapshot } = {}
  private files: { [file: string]: ts.IScriptSnapshot } = {}

  getLibs(code: string) {
    const reg = /[import|export]\s*?.*?\sfrom\s*?['"](.*?)['"]/g
    const matches = code.match(reg)
    if (!matches) return []
    return matches.map(str => str.replace(reg, '$1'))
  }

  // Fetch type definitions from DefinitelyTyped repo
  async fetchCode(libName: string) {
    const res = await fetch(
      `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`
    )
    if (res.ok) return res.text()
  }

  // TODO: Check if line and character are valid
  // Always stop at debugger after upgrade to TS@2.5
  async createService(code: string, fileName: string) {
    const libs = this.getLibs(code)
    const libsCode = await Promise.all(libs.map(lib => this.fetchCode(lib)))
    libs.forEach((name, i) => {
      const code = libsCode[i]
      if (code) {
        this.libs[name] = ts.ScriptSnapshot.fromString(code)
      }
    })

    // if (this._languageService) {
    // }

    this.files[fileName] = ts.ScriptSnapshot.fromString(code)

    const regex = /^\/node_modules\/(.*?)\/index.d.ts$/
    console.log(this.files)

    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => {
        const files = [...Object.keys(this.files), ...types.map(type => `/node_modules/${type}/index.d.ts`)]
        return files
      },
      getScriptVersion: () => '0', // Version matters not here since no file change
      getScriptSnapshot: fileName => {
        if (fileName === defaultLibName) {
          return ts.ScriptSnapshot.fromString(defaultLib)
        }

        if (Object.keys(this.files).includes(fileName)) {
          return this.files[fileName]
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
        // traceResolution: true,
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
    this._program = this._languageService.getProgram()
  }

  private getPosition(line: number, character: number, fileName: string) {
    return this._program.getSourceFile(fileName).getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const references = this._languageService.getReferencesAtPosition(fileName, position)

    if (!references) return []

    return references.map(reference => ({
      isWriteAccess: reference.isWriteAccess,
      range: this._program.getSourceFile(fileName).getLineAndCharacterOfPosition(reference.textSpan.start),
      width: reference.textSpan.length,
    }))
  }

  getDefinition(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const infos = this._languageService.getDefinitionAtPosition(fileName, position)

    // Sometime returns undefined
    if (!infos) return []

    const infosOfFile = infos.filter(info => info.fileName === fileName)
    if (infosOfFile.length === 0) return []

    return this._program.getSourceFile(fileName).getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
  }

  getQuickInfo(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const quickInfo = this._languageService.getQuickInfoAtPosition(fileName, position)
    if (!quickInfo) return

    // TODO: Colorize display parts
    return {
      info: quickInfo.displayParts,
      range: this._program.getSourceFile(fileName).getLineAndCharacterOfPosition(quickInfo.textSpan.start),
      width: quickInfo.textSpan.length,
    }
  }
}
