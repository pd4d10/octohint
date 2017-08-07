abstract class Service {
  fileName: string

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    this.createService(code)
  }

  abstract createService(code: string): void
  abstract getOccurrences(line: number, character: number): any
  abstract getDefinition(line: number, character: number): any
  abstract getQuickInfo(line: number, character: number): any
}

export default Service
