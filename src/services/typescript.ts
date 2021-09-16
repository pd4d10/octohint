import path from 'path'
import ts from 'typescript'
import { BaseService, fetchCode, fetchWithCredentials } from './base'
import stdLibs from './node-libs.json'
import { without, uniq } from 'lodash-es'
import { HintRequest } from '../types'
import { TS_LIB } from '../ts-lib'

const defaultLibName = '//lib.d.ts'

function getFullLibName(name: string) {
  return `/node_modules/@types/${name}/index.d.ts`
}

const files: Record<string, string> = {
  [defaultLibName]: TS_LIB,
}

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#incremental-build-support-using-the-language-services
const languageService = ts.createLanguageService(
  {
    getScriptFileNames() {
      return Object.keys(files)
    },
    getScriptVersion() {
      return '0'
    },
    getScriptSnapshot(fileName) {
      if (files[fileName]) {
        return ts.ScriptSnapshot.fromString(files[fileName])
      }
    },
    getCurrentDirectory() {
      return '/'
    },
    getDefaultLibFileName() {
      return defaultLibName
    },
    getCompilationSettings() {
      return {
        allowJs: true, // necessary for JS files
      }
    },
    // log: console.log,
    // trace: console.log,
    // error: console.error,
  },
  ts.createDocumentRegistry(),
)

function getSourceFile(file: string) {
  // This is necesarry because createService is asynchronous
  return languageService.getProgram()?.getSourceFile(file)
}

// FIXME: Very slow when click type `string`
// TODO: Go to definition for third party libs
class TsService extends BaseService {
  async createService(message: HintRequest) {
    if (files[message.file]) return

    const code = await fetchCode(message)
    files[message.file] = code

    // get third party deps
    let deps: string[] = []

    for (const reg of [/[import|export].*?from\s*?['"](.*?)['"]/g, /require\(['"](.*?)['"]\)/g]) {
      // TODO: Exclude comment
      const matches = code.match(reg) || []
      // console.log(reg, matches)
      // Exclude node standard libs
      deps = [
        ...deps,
        ...without(
          matches
            .map((str) => str.replace(reg, '$1'))
            .map((str) => str.split('/')[0]) // Extract correct lib of `lodash/throttle`
            .filter((item) => item[0] !== '.'), // Exclude relative path, like `./xxx`
          ...stdLibs,
        ),
      ]
    }

    deps = uniq(deps)
    console.log('deps:', deps)

    // try to get type definitions
    await Promise.all(
      deps.map(async (name) => {
        const fullname = getFullLibName(name)
        if (files[fullname]) return

        const prefix = 'https://unpkg.com'
        try {
          // Find typings file path
          const packageJson = await fetch(`${prefix}/${name}/package.json`).then<
            Record<string, unknown>
          >((res) => res.json())

          const typeFile = packageJson.types ?? packageJson.typings

          // if types not specified, try DefinitelyTyped
          const url = typeFile
            ? path.join(`${prefix}/${name}`, typeFile as string)
            : `${prefix}/@types/${name}/index.d.ts`

          files[getFullLibName(name)] = await fetchWithCredentials(url)
        } catch (err) {
          console.error(err)
        }
      }),
    )
  }

  getOccurrences(req: HintRequest) {
    const s = getSourceFile(req.file)
    if (s) {
      const position = s.getPositionOfLineAndCharacter(req.line, req.character)
      const references = languageService.getReferencesAtPosition(req.file, position)
      if (references) {
        return references
          .filter(({ fileName }) => fileName === req.file)
          .map((reference) => ({
            isWriteAccess: reference.isWriteAccess,
            range: s.getLineAndCharacterOfPosition(reference.textSpan.start),
            width: reference.textSpan.length,
          }))
      }
    }
  }

  getDefinition(req: HintRequest) {
    const s = getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        return
      }
      const definitions = languageService.getDefinitionAtPosition(req.file, position)
      if (definitions) {
        const infosOfCurrentFile = definitions.filter((d) => d.fileName === req.file)
        if (infosOfCurrentFile.length) {
          return s.getLineAndCharacterOfPosition(infosOfCurrentFile[0].textSpan.start)
        }
      }
    }
  }

  getQuickInfo(req: HintRequest) {
    const s = getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        // console.error(err)
        return
      }
      const quickInfo = languageService.getQuickInfoAtPosition(req.file, position)
      if (quickInfo && quickInfo.displayParts) {
        // TODO: Colorize display parts
        return {
          info: quickInfo.displayParts,
          range: s.getLineAndCharacterOfPosition(quickInfo.textSpan.start),
          width: quickInfo.textSpan.length,
        }
      }
    }
  }
}

export const tsService = new TsService()
