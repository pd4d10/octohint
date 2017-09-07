import * as ts from 'typescript'
import { S } from './service'
import { getRawUrl, getFullLibName } from '../../utils'

const defaultLibName = '//lib.d.ts'
const defaultLib = ts.ScriptSnapshot.fromString(window.TS_LIB)

const defaultLibs = require('../../libs.json').reduce((obj: { [key: string]: null }, name: string) => {
  obj[getFullLibName(name)] = null
  return obj
}, {})

defaultLibs['typescript'] = require('raw-loader!typescript/lib/typescript.d.ts')

export default class TSService implements S {
  private service: ts.LanguageService
  private program: ts.Program
  private files: {
    [key: string]: {
      version: number
      snapshot: ts.IScriptSnapshot
    }
  } = {}

  constructor(fileName: string) {
    this.createService(fileName)
  }

  getLibs(code: string) {
    const reg = /[import|export]\s*?.*?\sfrom\s*?['"](.*?)['"]/g
    const matches = code.match(reg)
    if (!matches) {
      return []
    } else {
      return matches.map(str => str.replace(reg, '$1')).filter(name => typeof defaultLibs[name] !== 'undefined')
    }
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

  private updateSnapshot(fileName: string, code: string) {
    if (this.files[fileName]) {
      this.files[fileName].version += 1
      this.files[fileName].snapshot = ts.ScriptSnapshot.fromString(code)
    } else {
      this.files[fileName] = {
        version: 0,
        snapshot: ts.ScriptSnapshot.fromString(code),
      }
    }
  }

  // TODO: Check if line and character are valid
  // Always stop at debugger after upgrade to TS@2.5
  async createService(fileName: string) {
    const code = await this.fetchFileCode(fileName)
    this.updateSnapshot(fileName, code)

    const libs = this.getLibs(code)
    const libsCode = await Promise.all(libs.map(lib => this.fetchLibCode(lib)))

    libs.forEach((name, i) => {
      const code = libsCode[i]
      if (code) {
        const libName = getFullLibName(name)
        this.updateSnapshot(libName, code)
      }
    })

    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => Object.keys(this.files),
      getScriptVersion: fileName => {
        return this.files[fileName] && this.files[fileName].version.toString()
      },
      getScriptSnapshot: fileName => {
        if (fileName === defaultLibName) {
          return defaultLib
        } else {
          return this.files[fileName] && this.files[fileName].snapshot
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
    this.service = ts.createLanguageService(host, ts.createDocumentRegistry())
    this.program = this.service.getProgram()
  }

  private getPosition(line: number, character: number, fileName: string) {
    return this.program.getSourceFile(fileName).getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const references = this.service.getReferencesAtPosition(fileName, position)

    if (!references) return []

    return references.filter(r => r.fileName === fileName).map(reference => ({
      isWriteAccess: reference.isWriteAccess,
      range: this.program.getSourceFile(fileName).getLineAndCharacterOfPosition(reference.textSpan.start),
      width: reference.textSpan.length,
    }))
  }

  getDefinition(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const infos = this.service.getDefinitionAtPosition(fileName, position)

    // Sometime returns undefined
    if (!infos) return []

    const infosOfFile = infos.filter(info => info.fileName === fileName)
    if (infosOfFile.length === 0) return []

    return this.program.getSourceFile(fileName).getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
  }

  getQuickInfo(line: number, character: number, fileName: string) {
    const position = this.getPosition(line, character, fileName)
    const quickInfo = this.service.getQuickInfoAtPosition(fileName, position)
    if (!quickInfo) return

    // TODO: Colorize display parts
    return {
      info: quickInfo.displayParts,
      range: this.program.getSourceFile(fileName).getLineAndCharacterOfPosition(quickInfo.textSpan.start),
      width: quickInfo.textSpan.length,
    }
  }
}
