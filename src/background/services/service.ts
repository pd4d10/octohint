import { Occurrence, QuickInfo, Definition } from '../../types'

export interface Service {
  getOccurrences(name: string, line: number, character: number): Occurrence[]
  getDefinition(name: string, line: number, character: number): Definition | undefined
  getQuickInfo(name: string, line: number, character: number): QuickInfo | undefined
}

export abstract class SingleFileService {
  fileName: string

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    this.createService(code, fileName)
  }

  abstract createService(code: string, fileName: string): void
}
