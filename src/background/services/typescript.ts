import * as ts from 'typescript'
import Service from './service'
import { getRawUrl, getFullLibName } from '../../utils'

const defaultLibName = '//lib.d.ts'
const defaultLib = ts.ScriptSnapshot.fromString(window.TS_LIB)

const defaultLibs = require('../../libs.json').reduce((obj: { [key: string]: null }, name: string) => {
  obj[getFullLibName(name)] = null
  return obj
}, {})

export default class TSService extends Service {
  private _languageService: ts.LanguageService
  private _program: ts.Program
  private files: { [file: string]: ts.IScriptSnapshot } = {}

  getLibs(code: string) {
    const reg = /[import|export]\s*?.*?\sfrom\s*?['"](.*?)['"]/g
    const matches = code.match(reg)
    if (!matches) {
      return []
    }
    const libs = matches.map(str => str.replace(reg, '$1'))
    return libs
  }

  async fetchFileCode(fileName: string) {
    const res = await fetch(getRawUrl(fileName))
    if (res.ok) {
      return res.text()
    } else {
      throw new Error(fileName)
    }
  }

  // Fetch type definitions from DefinitelyTyped repo
  async fetchLibCode(libName: string) {
    const res = await fetch(
      `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`
    )
    if (res.ok) {
      return res.text()
    }
  }

  addFile(fileName: string, code: string) {
    return this.createService(code, fileName)
  }

  // TODO: Check if line and character are valid
  // Always stop at debugger after upgrade to TS@2.5
  async createService(c: string, fileName: string) {
    const code = await this.fetchFileCode(fileName)
    this.files[fileName] = ts.ScriptSnapshot.fromString(code)

    const libs = this.getLibs(code).filter(name => {
      return typeof defaultLibs[name] !== 'undefined'
    })

    const libsCode = await Promise.all(libs.map(lib => this.fetchLibCode(lib)))
    libs.forEach((name, i) => {
      const code = libsCode[i]
      if (code) {
        this.files[getFullLibName(name)] = ts.ScriptSnapshot.fromString(code)
      }
    })

    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => Object.keys(this.files),
      getScriptVersion: () => '0', // Version matters not here since no file change
      getScriptSnapshot: fileName => {
        console.log(fileName)
        if (fileName === defaultLibName) {
          return defaultLib
        } else {
          return this.files[fileName]
        }
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({
        allowJs: true,
        // diagnostics: true,
        // traceResolution: true,
        allowSyntheticDefaultImports: true,
        // lib: ['lib.es6.d.ts'],
      }),
      getDefaultLibFileName: () => defaultLibName,
      // getDefaultLibFileName: options => ts.getDefaultLibFileName(options),
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

    return references.filter(r => r.fileName === fileName).map(reference => ({
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
