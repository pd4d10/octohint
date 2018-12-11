import * as $t from '../../types'

abstract class BaseService {
  abstract getOccurrences(info: $t.PositionInfo): $t.Occurrence[] | void
  abstract getDefinition(info: $t.PositionInfo): $t.Definition | void
  abstract getQuickInfo(info: $t.PositionInfo): $t.QuickInfo | void

  async fetchWithCredentials(url: string, isJson = false) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) {
      throw new Error(`url fetch fails: ${url}`)
    }
    return await res[isJson ? 'json' : 'text']()
  }

  async fetchCode(message: $t.ContentMessage) {
    const code = await this.fetchWithCredentials(message.codeUrl)
    return code.replace(/\t/g, ' '.repeat(message.tabSize))
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(message: $t.ContentMessage) {
    super()
    this.file = message.file
    this.fetchCodeAndCreateService(message)
  }

  async fetchCodeAndCreateService(message: $t.ContentMessage) {
    const code = await this.fetchCode(message)
    this.createService(code)
  }
}
