import { Occurrence, QuickInfo, Definition } from '../../types'

abstract class Service {
  fileName: string

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    // console.log(fileName)
    this.createService(code, fileName)
  }

  abstract createService(code: string, fileName: string): void
  abstract getOccurrences(line: number, character: number): Occurrence[] | void
  abstract getDefinition(line: number, character: number): Definition | void
  abstract getQuickInfo(line: number, character: number): QuickInfo | void
}

export default Service
