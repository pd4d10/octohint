import { Occurrence, QuickInfo, Definition, MessageFromContentScript } from '../../types'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): Occurrence[] | void
  abstract getDefinition(file: string, line: number, character: number): Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): QuickInfo | void

  async fetchCode(message: MessageFromContentScript) {
    const r0 = await fetch(message.codeUrl, { credentials: 'same-origin' })
    if (!r0.ok) {
      throw new Error(message.codeUrl)
    }
    let code = await r0.text()
    if (!code.includes('\t')) {
      return code
    }

    return code.replace(/\t/g, ' '.repeat(message.tabSize))
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(message: MessageFromContentScript) {
    super()
    this.file = message.file
    this.fetchCodeAndCreateService(message)
  }

  async fetchCodeAndCreateService(message: MessageFromContentScript) {
    const code = await this.fetchCode(message)
    this.createService(code)
  }
}
