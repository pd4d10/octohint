import * as ts from 'typescript'
import { Service } from './service'
import { getRawUrl, getFullLibName, getEditorConfigUrl, getTabSizeFromEditorConfig } from '../../utils'

const defaultLibName = '//lib.d.ts'
const defaultLib = ts.ScriptSnapshot.fromString(window.TS_LIB)

const defaultLibs = require('../../libs.json').reduce((obj: { [key: string]: null }, name: string) => {
  obj[getFullLibName(name)] = null
  return obj
}, {})

defaultLibs['typescript'] = require('raw-loader!typescript/lib/typescript.d.ts')

export default class TSService implements Service {
  private service: ts.LanguageService
  private program: ts.Program
  private files: {
    [key: string]: {
      version: number
      content: string
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

  async fetchFileCode(name: string) {
    const res = await fetch(getRawUrl(name))
    if (res.ok) {
      return res.text()
    } else {
      throw new Error(name)
    }
  }

  async getTabSize(name: string) {
    const res = await fetch(getEditorConfigUrl(name))
    if (res.ok) {
      const config = await res.text()
      return getTabSizeFromEditorConfig(config) || 8
    } else {
      return 8
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

  private updateContent(fileName: string, code: string) {
    if (this.files[fileName]) {
      if (this.files[fileName].content !== code) {
        this.files[fileName].version += 1
        this.files[fileName].content = code
      }
    } else {
      this.files[fileName] = {
        version: 0,
        content: code,
      }
    }
  }

  // TODO: Check if line and character are valid
  // Always stop at debugger after upgrade to TS@2.5
  async createService(name: string) {
    const code = await this.fetchFileCode(name)

    // If code has tab, try to get .editorconfig's intent_size
    let tabSize = 8
    if (code.includes('\t')) {
      tabSize = await this.getTabSize(name)
    }

    this.updateContent(name, code.replace(/\t/g, ' '.repeat(tabSize)))

    const libs = this.getLibs(code)
    const libsCode = await Promise.all(libs.map(lib => this.fetchLibCode(lib)))

    libs.forEach((name, i) => {
      const code = libsCode[i]
      if (code) {
        const libName = getFullLibName(name)
        this.updateContent(libName, code)
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
        } else if (this.files[fileName]) {
          return ts.ScriptSnapshot.fromString(this.files[fileName].content)
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

  private getPosition(name: string, line: number, character: number) {
    return this.program.getSourceFile(name).getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(name: string, line: number, character: number) {
    const position = this.getPosition(name, line, character)
    const references = this.service.getReferencesAtPosition(name, position)
    if (references) {
      return references.filter(r => r.fileName === name).map(reference => ({
        isWriteAccess: reference.isWriteAccess,
        range: this.program.getSourceFile(name).getLineAndCharacterOfPosition(reference.textSpan.start),
        width: reference.textSpan.length,
      }))
    } else {
      return []
    }
  }

  getDefinition(name: string, line: number, character: number) {
    const position = this.getPosition(name, line, character)
    const infos = this.service.getDefinitionAtPosition(name, position)
    if (infos) {
      const infosOfFile = infos.filter(info => info.fileName === name)
      if (infosOfFile.length) {
        return this.program.getSourceFile(name).getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
      }
    }
  }

  getQuickInfo(name: string, line: number, character: number) {
    const position = this.getPosition(name, line, character)
    const quickInfo = this.service.getQuickInfoAtPosition(name, position)
    if (quickInfo) {
      // TODO: Colorize display parts
      return {
        info: quickInfo.displayParts,
        range: this.program.getSourceFile(name).getLineAndCharacterOfPosition(quickInfo.textSpan.start),
        width: quickInfo.textSpan.length,
      }
    }
  }
}
