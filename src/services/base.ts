import { HintRequest, HintResponse } from '../types'

export abstract class BaseService {
  abstract getOccurrences(req: HintRequest): HintResponse['occurrences']
  abstract getDefinition(req: HintRequest): HintResponse['definition']
  abstract getQuickInfo(req: HintRequest): HintResponse['quickInfo']

  async fetchWithCredentials(url: string, isJson = false) {
    const res = await fetch(url, { credentials: 'same-origin' })
    if (!res.ok) {
      throw new Error(`url fetch fails: ${url}`)
    }
    return isJson ? res.json() : res.text()
  }

  async fetchCode(req: HintRequest) {
    const code = await this.fetchWithCredentials(req.codeUrl)
    return code.replace(/\t/g, ' '.repeat(req.tabSize))
  }
}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(req: HintRequest) {
    super()
    this.file = req.file
    this.fetchCodeAndCreateService(req)
  }

  async fetchCodeAndCreateService(req: HintRequest) {
    const code = await this.fetchCode(req)
    this.createService(code)
  }
}
