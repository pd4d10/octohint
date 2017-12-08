import { Occurrence, QuickInfo, Definition } from '../../types'

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
    // TODO: Use editorconfig parse
    if (editorConfigUrl) {
      const r1 = await fetch(editorConfigUrl, { credentials: 'same-origin' })
      if (r1.ok) {
        const config = await r1.text()
        const lines = config.split('\n')
        for (const line of lines) {
          if (line.includes('indent_size')) {
            const value = line.split('=')[1].trim()
            tabSize = parseInt(value, 10)
            break
          }
        }
      }
    }
    return code.replace(/\t/g, ' '.repeat(tabSize))
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  codeUrl: string
  editorConfigUrl?: string
  abstract createService(code: string): void

  constructor(file: string, codeUrl: string, editorConfigUrl?: string) {
    super()
    this.file = file
    this.codeUrl = codeUrl
    this.editorConfigUrl = editorConfigUrl
    this.fetchCodeAndCreateService()
  }

  async fetchCodeAndCreateService() {
    const code = await this.fetchCode(this.codeUrl, this.editorConfigUrl)
    this.createService(code)
  }
}
