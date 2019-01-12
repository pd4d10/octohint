import { ContentMessage, PositionInfo, Occurrence, Definition, QuickInfo } from '../../types'

abstract class BaseService {
  abstract getOccurrences(info: PositionInfo): Occurrence[] | void
  abstract getDefinition(info: PositionInfo): Definition | void
  abstract getQuickInfo(info: PositionInfo): QuickInfo | void

  async fetchWithCredentials(url: string, isJson = false) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) {
      throw new Error(`url fetch fails: ${url}`)
    }
    return await res[isJson ? 'json' : 'text']()
  }

  async fetchCode(message: ContentMessage) {
    const code = await this.fetchWithCredentials(message.codeUrl)
    return code.replace(/\t/g, ' '.repeat(message.tabSize))
  }
}

export abstract class MultipleFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(message: ContentMessage) {
    super()
    this.file = message.file
    this.fetchCodeAndCreateService(message)
  }

  async fetchCodeAndCreateService(message: ContentMessage) {
    const code = await this.fetchCode(message)
    this.createService(code)
  }
}
