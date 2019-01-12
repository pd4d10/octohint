import ts from 'typescript'
import { MultipleFileService } from './base'
import * as path from 'path'
import stdLibs from './node-libs.json'
import { without, uniq } from 'lodash-es'
import { ContentMessage, PositionInfo } from '../../types'

const defaultLibName = '//lib.d.ts'

function getFullLibName(name: string) {
  return `/node_modules/@types/${name}/index.d.ts`
}

interface Files {
  [fileName: string]: {
    version: number
    content: string
    // dependencies: string[]
  }
}

// FIXME: Very slow when click type `string`
// TODO: Go to definition for third party libs
export class TsService extends MultipleFileService {
  private service?: ts.LanguageService
  private getSourceFile(file: string) {
    // This is necesarry because createService is asynchronous
    if (this.service) {
      const program = this.service.getProgram()
      if (program) {
        return program.getSourceFile(file)
      }
    }
  }
  private files: Files = {}
  // private libs: Files = {}

  // Use regex to get third party lib names
  getLibNamesFromCode(code: string) {
    const regs = [/[import|export].*?from\s*?['"](.*?)['"]/g, /require\(['"](.*?)['"]\)/g] // TODO: Exclude comment
    let result: string[] = []
    for (const reg of regs) {
      const matches = code.match(reg) || []
      // console.log(reg, matches)
      // Exclude node standard libs
      const libs = without(
        matches
          .map(str => str.replace(reg, '$1'))
          .map(str => str.split('/')[0]) // Extract correct lib of `lodash/throttle`
          .filter(item => item[0] !== '.'), // Exclude relative path, like `./xxx`
        ...stdLibs,
      )
      result = [...result, ...libs]
    }
    return uniq(result)
  }

  // Try to get type definition
  async fetchLibCode(name: string) {
    const fullname = getFullLibName(name)
    if (this.files[fullname]) {
      return
    }

    const prefix = 'https://unpkg.com'
    try {
      // Find typings file path
      const { types, typings } = await this.fetchWithCredentials(
        path.join(prefix, name, 'package.json'),
        true,
      )
      if (types || typings) {
        return await this.fetchWithCredentials(path.join(prefix, name, types || typings))
      }

      // If typings not specified, try DefinitelyTyped
      return await this.fetchWithCredentials(path.join(prefix, '@types', name, 'index.d.ts'))
    } catch (err) {
      console.error(err)
    }
  }

  private updateContent(name: string, code: string) {
    if (this.files[name]) {
      // TODO: Make version work
      // Fetch code every time is too expensive

      // if (this.files[fileName].content !== code) {
      //   this.files[fileName].version += 1
      //   this.files[fileName].content = code
      // }
      return
    } else {
      this.files[name] = {
        version: 0,
        content: code,
        // dependencies: [],
      }
    }
    console.log('Updated, current files:', this.files)
  }

  // Notice that this method is asynchronous
  async createService(message: ContentMessage) {
    if (this.files[message.file]) return

    const defaultLib = await import('../../ts-lib')
    const code = await this.fetchCode(message)
    this.updateContent(message.file, code)

    const libNames = this.getLibNamesFromCode(code)
    console.log('Libs:', libNames)
    const libCodes = await Promise.all(libNames.map(lib => this.fetchLibCode(lib)))
    libNames.forEach((name, i) => {
      const code = libCodes[i]
      if (code) {
        // this.files[fileName].dependencies.push(name)
        this.updateContent(getFullLibName(name), code)
      }
    })

    // https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
    const host: ts.LanguageServiceHost = {
      getScriptFileNames: () => {
        const fileNames = Object.keys(this.files)
        // console.log('getScriptFileNames:', fileNames)
        return fileNames
      },
      getScriptVersion: fileName => {
        const version = (this.files[fileName] && this.files[fileName].version.toString()) || '0'
        // console.log('getScriptVersion:', fileName, version)
        return version
      },
      getScriptSnapshot: fileName => {
        let snapshot
        if (fileName === defaultLibName) {
          snapshot = defaultLib
        } else if (this.files[fileName]) {
          snapshot = ts.ScriptSnapshot.fromString(this.files[fileName].content)
        }
        // console.log('getScriptSnapshot', fileName)
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
  }

  // getPosition(sourceFile: ts.SourceFile, line: number, character: number) {
  //   return sourceFile.getPositionOfLineAndCharacter(line, character)
  // }

  getOccurrences(info: PositionInfo) {
    const instance = this.getSourceFile(info.file)
    if (instance) {
      // After upgrading to typescript@2.5
      // When mouse position is invalid (outside the code area), always break on a debugger expression
      // https://github.com/Microsoft/TypeScript/blob/9e51882d9cb1efdd164e27e98f3de2d5294b8257/src/compiler/scanner.ts#L341
      // Deactivate breakpoint to prevent annoying break, and catch this error
      // let position: number
      // try {
      const position = instance.getPositionOfLineAndCharacter(info.line, info.character)
      // } catch (err) {
      //   console.error(err)
      //   return
      // }
      if (this.service) {
        const references = this.service.getReferencesAtPosition(info.file, position)
        if (references) {
          return references
            .filter(({ fileName }) => fileName === info.file)
            .map(reference => ({
              isWriteAccess: reference.isWriteAccess,
              range: instance.getLineAndCharacterOfPosition(reference.textSpan.start),
              width: reference.textSpan.length,
            }))
        }
      }
    }
  }

  getDefinition(info: PositionInfo) {
    const instance = this.getSourceFile(info.file)
    if (this.service && instance) {
      let position: number
      try {
        position = instance.getPositionOfLineAndCharacter(info.line, info.character)
      } catch (err) {
        return
      }
      const definitions = this.service.getDefinitionAtPosition(info.file, position)
      if (definitions) {
        const infosOfCurrentFile = definitions.filter(d => d.fileName === info.file)
        if (infosOfCurrentFile.length) {
          return instance.getLineAndCharacterOfPosition(infosOfCurrentFile[0].textSpan.start)
        }
      }
    }
  }

  getQuickInfo(info: PositionInfo) {
    const instance = this.getSourceFile(info.file)
    if (this.service && instance) {
      let position: number
      try {
        position = instance.getPositionOfLineAndCharacter(info.line, info.character)
      } catch (err) {
        // console.error(err)
        return
      }
      const quickInfo = this.service.getQuickInfoAtPosition(info.file, position)
      if (quickInfo && quickInfo.displayParts) {
        // TODO: Colorize display parts
        return {
          info: quickInfo.displayParts,
          range: instance.getLineAndCharacterOfPosition(quickInfo.textSpan.start),
          width: quickInfo.textSpan.length,
        }
      }
    }
  }
}
