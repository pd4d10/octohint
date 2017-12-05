import { Occurrence, QuickInfo, Definition } from '../../types'

abstract class BaseService {
  abstract getOccurrences(file: string, line: number, character: number): Occurrence[]
  abstract getDefinition(file: string, line: number, character: number): Definition | void
  abstract getQuickInfo(file: string, line: number, character: number): QuickInfo | void

  async fetchCode(file: string) {
    const rawUrl = file.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
    const r0 = await fetch(rawUrl)
    if (!r0.ok) {
      throw new Error(file)
    }
    let code = await r0.text()
    if (!code.includes('\t')) {
      return code
    }

    // If code has tab, try to get editorconfig's intent_size
    let tabSize = 8
    // TODO: Use editorconfig parse
    const editorconfigUrl = rawUrl.replace(/(^.*?\/.*?\/.*?)\/.*/, '$1') + '/.editorconfig'
    const r1 = await fetch(editorconfigUrl)
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
    return code.replace(/\t/g, ' '.repeat(tabSize))
  }
}

export abstract class MultiFileService extends BaseService {}

export abstract class SingleFileService extends BaseService {
  file: string
  abstract createService(code: string): void

  constructor(file: string) {
    super()
    this.file = file
    this.fetchCodeAndCreateService()
  }

  async fetchCodeAndCreateService() {
    const code = await this.fetchCode(this.file)
    this.createService(code)
  }
}
