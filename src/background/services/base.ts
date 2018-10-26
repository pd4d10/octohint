import * as types from '../../types'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): types.Occurrence[] | void
  abstract getDefinition(file: string, line: number, character: number): types.Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): types.QuickInfo | void

  async fetchCode(message: types.MessageFromContentScript) {
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

  constructor(message: types.MessageFromContentScript) {
    super()
    this.file = message.file
    this.fetchCodeAndCreateService(message)
  }

  async fetchCodeAndCreateService(message: types.MessageFromContentScript) {
    const code = await this.fetchCode(message)
    this.createService(code)
  }
}
