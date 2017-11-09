import { Occurrence, QuickInfo, Definition } from '../../types'
import { getRawUrl, getFullLibName, getEditorConfigUrl } from '../../utils'

export interface Service {
  getOccurrences(file: string, line: number, character: number): Occurrence[]
  getDefinition(file: string, line: number, character: number): Definition | void
  getQuickInfo(file: string, line: number, character: number): QuickInfo | void
}

export abstract class SingleFileService {
  file: string

  constructor(file: string) {
    this.file = file
    this.fetchFileCode(file)
  }

  async fetchFileCode(file: string) {
    const res = await fetch(getRawUrl(file))
    if (res.ok) {
      const code = await res.text()
      this.createService(code)
    } else {
      throw new Error(file)
    }
  }

  abstract createService(code: string): void
}
