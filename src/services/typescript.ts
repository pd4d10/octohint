import path from 'path'
import ts from 'typescript'
import { VirtualTypeScriptEnvironment } from '@typescript/vfs'
import { BaseService, fetchWithCredentials } from './base'
import stdLibs from './node-libs.json'
import { without, uniq } from 'lodash-es'
import { HintRequest } from '../types'

function getFullLibName(name: string) {
  return `/node_modules/@types/${name}/index.d.ts`
}

// FIXME: Very slow when click type `string`
// TODO: Go to definition for third party libs
export class TsService extends BaseService {
  constructor(public system: ts.System, public env: VirtualTypeScriptEnvironment) {
    super()
  }

  async addFile(req: HintRequest) {
    if (this.system.fileExists(req.file)) return

    this.env.createFile(req.file, req.code)

    // get third party deps
    let deps: string[] = []

    for (const reg of [/[import|export].*?from\s*?['"](.*?)['"]/g, /require\(['"](.*?)['"]\)/g]) {
      // TODO: Exclude comment
      const matches = req.code.match(reg) || []
      // console.log(reg, matches)
      // Exclude node standard libs
      deps = [
        ...deps,
        ...without(
          matches
            .map((str) => str.replace(reg, '$1'))
            .map((str) => str.split('/')[0]) // Extract correct lib of `lodash/throttle`
            .filter((item) => item[0] !== '.'), // Exclude relative path, like `./xxx`
          ...stdLibs
        ),
      ]
    }

    deps = uniq(deps)
    console.log('deps:', deps)

    // try to get type definitions
    await Promise.all(
      deps.map(async (name) => {
        const fullname = getFullLibName(name)
        if (this.system.fileExists(fullname)) return

        const prefix = 'https://cdn.jsdelivr.net/npm'
        try {
          // Find typings file path
          const packageJson = await fetch(`${prefix}/${name}/package.json`).then<Record<string, unknown>>((res) =>
            res.json()
          )

          const typeFile = packageJson.types ?? packageJson.typings

          // if types not specified, try DefinitelyTyped
          const url = typeFile
            ? path.join(`${prefix}/${name}`, typeFile as string)
            : `${prefix}/@types/${name}/index.d.ts`

          this.env.createFile(getFullLibName(name), await fetchWithCredentials(url))
        } catch (err) {
          console.error(err)
        }
      })
    )
  }

  getOccurrences(req: HintRequest) {
    const s = this.env.getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        console.error(err)
        return
      }
      const references = this.env.languageService.getReferencesAtPosition(req.file, position)
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
    const s = this.env.getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        console.error(err)
        return
      }
      const definitions = this.env.languageService.getDefinitionAtPosition(req.file, position)
      if (definitions) {
        const infosOfCurrentFile = definitions.filter((d) => d.fileName === req.file)
        if (infosOfCurrentFile.length) {
          return s.getLineAndCharacterOfPosition(infosOfCurrentFile[0].textSpan.start)
        }
      }
    }
  }

  getQuickInfo(req: HintRequest) {
    const s = this.env.getSourceFile(req.file)
    if (s) {
      let position: number
      try {
        position = s.getPositionOfLineAndCharacter(req.line, req.character)
      } catch (err) {
        console.error(err)
        return
      }
      const quickInfo = this.env.languageService.getQuickInfoAtPosition(req.file, position)
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
