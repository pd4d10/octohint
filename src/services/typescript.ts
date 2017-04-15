import * as ts from 'typescript'
import Service from './service'

declare var require: any

const defaultLib = [
  require('raw-loader!typescript/lib/lib.d.ts'),
  require('raw-loader!typescript/lib/lib.dom.d.ts'),
  require('raw-loader!typescript/lib/lib.dom.iterable.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.collection.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.core.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.generator.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.iterable.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.promise.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.proxy.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.reflect.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.symbol.d.ts'),
  require('raw-loader!typescript/lib/lib.es2015.symbol.wellknown.d.ts'),
  require('raw-loader!typescript/lib/lib.es2016.array.include.d.ts'),
  require('raw-loader!typescript/lib/lib.es2016.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.object.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.sharedmemory.d.ts'),
  require('raw-loader!typescript/lib/lib.es2017.string.d.ts'),
  require('raw-loader!typescript/lib/lib.es5.d.ts'),
  require('raw-loader!typescript/lib/lib.es6.d.ts'),
  require('raw-loader!typescript/lib/lib.webworker.d.ts'),
].join('\n')

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
