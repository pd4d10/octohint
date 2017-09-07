import { Occurrence, QuickInfo, Definition } from '../../types'

export interface S {
  getOccurrences(line: number, character: number, fileName?: string): Occurrence[]
  getDefinition(line: number, character: number, fileName?: string): Definition
  getQuickInfo(line: number, character: number, fileName?: string): QuickInfo
}

abstract class OtherService implements S {
  fileName: string

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    this.createService(code, fileName)
  }

  abstract createService(code: string, fileName: string): void
  abstract getOccurrences(line: number, character: number, fileName?: string): Occurrence[]
  abstract getDefinition(line: number, character: number, fileName?: string): Definition
  abstract getQuickInfo(line: number, character: number, fileName?: string): QuickInfo
}

export default OtherService
