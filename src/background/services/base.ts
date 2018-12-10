import * as types from '../../types'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): types.Occurrence[] | void
  abstract getDefinition(file: string, line: number, character: number): types.Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): types.QuickInfo | void

  async fetchWithCredentials(url: string, isJson = false) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) {
      throw new Error(`url fetch fails: ${url}`)
    }
    return await res[isJson ? 'json' : 'text']()
  }

  async fetchCode(message: types.ContentMessage) {
    const code = await this.fetchWithCredentials(message.codeUrl)
    return code.replace(/\t/g, ' '.repeat(message.tabSize))
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(message: types.ContentMessage) {
    super()
    this.file = message.file
    this.fetchCodeAndCreateService(message)
  }

  async fetchCodeAndCreateService(message: types.ContentMessage) {
    const code = await this.fetchCode(message)
    this.createService(code)
  }
}
