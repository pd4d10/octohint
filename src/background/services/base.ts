import { parseString } from 'editorconfig/lib/ini'
import { Occurrence, QuickInfo, Definition } from '../../types'
import * as path from 'path'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): Occurrence[]
  abstract getDefinition(file: string, line: number, character: number): Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): QuickInfo | void

  async fetchCode(codeUrl: string) {
    const r0 = await fetch(codeUrl, { credentials: 'same-origin' })
    if (!r0.ok) {
      throw new Error(codeUrl)
    }
    let code = await r0.text()
    if (!code.includes('\t')) {
      return code
    }

    return code.replace(/\t/g, ' '.repeat(8)) // Case NaN
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(file: string, codeUrl: string) {
    super()
    this.file = file
    this.fetchCodeAndCreateService(codeUrl)
  }

  async fetchCodeAndCreateService(codeUrl: string) {
    const code = await this.fetchCode(codeUrl)
    this.createService(code)
  }
}
