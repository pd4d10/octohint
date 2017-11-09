import * as ts from 'typescript'
import { Service } from './base'
import { getRawUrl, getFullLibName, getEditorConfigUrl } from '../../utils'
import * as libsArr from '../../libs.js'

const defaultLibName = '//lib.d.ts'
const defaultLib = ts.ScriptSnapshot.fromString(window.TS_LIB)

const defaultLibs: any = libsArr.reduce((obj: { [key: string]: null }, name: string) => {
  obj[getFullLibName(name)] = null
  return obj
}, {})

defaultLibs['typescript'] = require('raw-loader!typescript/lib/typescript.d.ts')

// FIXME: Very slow when click type `string`
// TODO: Files timeout
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

  getLibsFromCode(code: string) {
    const reg = /[import|export]\s*?.*?\sfrom\s*?['"](.*?)['"]/g
    const matches = code.match(reg)
    if (matches) {
      return matches.map(str => str.replace(reg, '$1')).filter(name => typeof defaultLibs[name] !== 'undefined')
    } else {
      return []
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

  // TODO: parse
  async getTabSize(name: string) {
    const res = await fetch(getEditorConfigUrl(name))
    if (res.ok) {
      const config = await res.text()
      const lines = config.split('\n')
      for (const line of lines) {
        if (line.includes('indent_size')) {
          const value = line.split('=')[1].trim()
          return parseInt(value, 10)
        }
      }
    }
    return 8
  }

  // Fetch type definitions from DefinitelyTyped repo
  async fetchLibCode(libName: string) {
    const url = `https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/types/${libName}/index.d.ts`
    const res = await fetch(url)
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
    console.log('Updated, current files:', this.files)
  }

  // TODO: Check if line and character are valid
  // Always stop at debugger after upgrade to TS@2.5
  async createService(file: string) {
    if (this.files[file]) {
      return
    }
    const code = await this.fetchFileCode(file)

    // If code has tab, try to get .editorconfig's intent_size
    let tabSize = 8
    if (code.includes('\t')) {
      tabSize = await this.getTabSize(file)
    }

    this.updateContent(file, code.replace(/\t/g, ' '.repeat(tabSize)))

    const libs = this.getLibsFromCode(code)
    console.log('Libs:', libs)
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
      getScriptFileNames: () => {
        const fileNames = Object.keys(this.files)
        console.log('getScriptFileNames:', fileNames)
        return fileNames
      },
      getScriptVersion: fileName => {
        const version = (this.files[fileName] && this.files[fileName].version.toString()) || '0'
        console.log('getScriptVersion:', fileName, version)
        return version
      },
      getScriptSnapshot: fileName => {
        let snapshot
        if (fileName === defaultLibName) {
          snapshot = defaultLib
        } else if (this.files[fileName]) {
          snapshot = ts.ScriptSnapshot.fromString(this.files[fileName].content)
        }
        console.log('getScriptSnapshot', fileName)
        return snapshot
      },
      getCurrentDirectory: () => '/',
      getCompilationSettings: () => ({
        allowJs: true,
        diagnostics: true,
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

  getOccurrences(file: string, line: number, character: number) {
    const instance = this.program.getSourceFile(file)
    const position = instance.getPositionOfLineAndCharacter(line, character)
    const references = this.service.getReferencesAtPosition(file, position) || []
    return references.filter(({ fileName }) => fileName === file).map(reference => ({
      isWriteAccess: reference.isWriteAccess,
      range: instance.getLineAndCharacterOfPosition(reference.textSpan.start),
      width: reference.textSpan.length,
    }))
  }

  getDefinition(file: string, line: number, character: number) {
    const instance = this.program.getSourceFile(file)
    const position = instance.getPositionOfLineAndCharacter(line, character)
    const infos = this.service.getDefinitionAtPosition(file, position)
    if (infos) {
      const infosOfCurrentFile = infos.filter(info => info.fileName === file)
      if (infosOfCurrentFile.length) {
        return instance.getLineAndCharacterOfPosition(infosOfCurrentFile[0].textSpan.start)
      }
    }
  }

  getQuickInfo(file: string, line: number, character: number) {
    const instance = this.program.getSourceFile(file)
    const position = instance.getPositionOfLineAndCharacter(line, character)
    const quickInfo = this.service.getQuickInfoAtPosition(file, position)
    if (quickInfo) {
      // TODO: Colorize display parts
      return {
        info: quickInfo.displayParts,
        range: instance.getLineAndCharacterOfPosition(quickInfo.textSpan.start),
        width: quickInfo.textSpan.length,
      }
    }
  }
}
