import * as ts from 'typescript'
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

// TODO: Include DOM and ES d.ts
export default class Service {
  fileName: string
  service: ts.LanguageService
  source: ts.SourceFile

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    this.createService(this.formatCode(code))
  }

  formatCode(code: string) {
    // FIXME: Replace tab with 8 space, GitHub's tab size
    return code.replace(/\t/g, '        ')
  }

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
    this.service = ts.createLanguageService(servicesHost, ts.createDocumentRegistry())
    const program = this.service.getProgram()
    this.source = program.getSourceFile(this.fileName)
  }

  private getPosition(line: number, character: number) {
    return this.source.getPositionOfLineAndCharacter(line, character)
  }

  getOccurrences(line: number, character: number) {
    const position = this.getPosition(line, character)
    const occurrences = this.service.getOccurrencesAtPosition(this.fileName, position)

    if (!occurrences) {
      return []
    }

    const data = occurrences.map(occurrence => ({
      isWriteAccess: occurrence.isWriteAccess,
      range: this.source.getLineAndCharacterOfPosition(occurrence.textSpan.start),
      width: occurrence.textSpan.length
    }))
    return data
  }

  getDefinition(line: number, character: number) {
    const position = this.getPosition(line, character)
    const infos = this.service.getDefinitionAtPosition(this.fileName, position) || []

    const infosOfFile = infos.filter(info => info.fileName === this.fileName)

    if (infosOfFile.length === 0) {
      return undefined
    }

    return this.source.getLineAndCharacterOfPosition(infosOfFile[0].textSpan.start)
  }

  getQuickInfo(line: number, character: number) {
    const position = this.getPosition(line, character)
    const quickInfo = this.service.getQuickInfoAtPosition(this.fileName, position)

    if (!quickInfo) {
      return undefined
    }

    const info = ts.displayPartsToString(quickInfo.displayParts)
    const range = this.source.getLineAndCharacterOfPosition(quickInfo.textSpan.start)

    const data = {
      info,
      range,
      width: quickInfo.textSpan.length
    }
    return data
  }
}
