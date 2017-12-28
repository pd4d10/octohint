import { parseString } from 'editorconfig/lib/ini'
import { Occurrence, QuickInfo, Definition } from '../../types'
import * as path from 'path'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): Occurrence[]
  abstract getDefinition(file: string, line: number, character: number): Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): QuickInfo | void

  async fetchCode(codeUrl: string, editorConfigUrl?: string) {
    const r0 = await fetch(codeUrl, { credentials: 'same-origin' })
    if (!r0.ok) {
      throw new Error(codeUrl)
    }
    let code = await r0.text()
    if (!code.includes('\t')) {
      return code
    }

    // If code has tab, try to get editorconfig's intent_size
    let tabSize = 8
    if (editorConfigUrl) {
      const r1 = await fetch(editorConfigUrl, { credentials: 'same-origin' })
      if (r1.ok) {
        const config = await r1.text()
        const ext = path.extname(codeUrl)
        const parsed = parseString(config)
        for (const item of parsed) {
          // *.js or *.js,*.ts
          if (item[0] && (item[0].includes('*.' + ext) || item[0].includes('*.' + ext + ',')) && item[1].indent_size) {
            tabSize = parseInt(item[1].indent_size, 10)
            break
          }
          if (item[0] === '*' && item[1].indent_size) {
            tabSize = parseInt(item[1].indent_size, 10)
            break
          }
          if (item[0] === null && item[1].indent_size) {
            tabSize = parseInt(item[1].indent_size, 10)
            break
          }
        }
        console.log('Final tab size: ', tabSize)
      }
    }
    return code.replace(/\t/g, ' '.repeat(tabSize || 8)) // Case NaN
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(file: string, codeUrl: string, editorConfigUrl?: string) {
    super()
    this.file = file
    this.fetchCodeAndCreateService(codeUrl, editorConfigUrl)
  }

  async fetchCodeAndCreateService(codeUrl: string, editorConfigUrl?: string) {
    const code = await this.fetchCode(codeUrl, editorConfigUrl)
    this.createService(code)
  }
}
