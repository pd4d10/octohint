import path from 'path'
import ts from 'typescript'
import {
  createDefaultMapFromCDN,
  createSystem,
  createVirtualTypeScriptEnvironment,
  VirtualTypeScriptEnvironment,
} from '@typescript/vfs'
import { BaseService, fetchCode, fetchWithCredentials } from './base'
import stdLibs from './node-libs.json'
import { without, uniq } from 'lodash-es'
import { HintRequest } from '../types'

function getFullLibName(name: string) {
  return `/node_modules/@types/${name}/index.d.ts`
}

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020, // TODO: latest, and node.js libs
  allowJs: true,
}

// FIXME: Very slow when click type `string`
// TODO: Go to definition for third party libs
class TsService extends BaseService {
  private system: ts.System | undefined
  private env: VirtualTypeScriptEnvironment | undefined

  async createService(message: HintRequest) {
    if (!this.system || !this.env) {
      await createDefaultMapFromCDN(
        compilerOptions,
        ts.version,
        false,
        ts,
        undefined,
        fetch,
        {} as any, // TODO:
      )

      this.system = createSystem(new Map<string, string>())
      this.env = createVirtualTypeScriptEnvironment(this.system, [], ts, compilerOptions)
    }

    if (this.system?.fileExists(message.file)) return

    const code = await fetchCode(message)
    this.env.createFile(message.file, code)

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
        if (this.system?.fileExists(fullname)) return

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

          this.env?.createFile(getFullLibName(name), await fetchWithCredentials(url))
        } catch (err) {
          console.error(err)
        }
      }),
    )
  }

  getOccurrences(req: HintRequest) {
    const s = this.env?.getSourceFile(req.file)
    if (s) {
      const position = s.getPositionOfLineAndCharacter(req.line, req.character)
      const references = this.env?.languageService.getReferencesAtPosition(req.file, position)
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
    const s = this.env?.getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        return
      }
      const definitions = this.env?.languageService.getDefinitionAtPosition(req.file, position)
      if (definitions) {
        const infosOfCurrentFile = definitions.filter((d) => d.fileName === req.file)
        if (infosOfCurrentFile.length) {
          return s.getLineAndCharacterOfPosition(infosOfCurrentFile[0].textSpan.start)
        }
      }
    }
  }

  getQuickInfo(req: HintRequest) {
    const s = this.env?.getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        // console.error(err)
        return
      }
      const quickInfo = this.env?.languageService.getQuickInfoAtPosition(req.file, position)
      if (quickInfo?.displayParts) {
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
