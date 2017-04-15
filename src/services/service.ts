abstract class Service {
  fileName: string

  constructor(fileName: string, code: string) {
    this.fileName = fileName
    this.createService(this.formatCode(code))
  }

  abstract createService(code: string): void
  abstract getOccurrences(line: number, character: number): any
  abstract getDefinition(line: number, character: number): any
  abstract getQuickInfo(line: number, character: number): any

  formatCode(code: string) {
    // FIXME: Replace tab with 8 space, GitHub's tab size
    return code.replace(/\t/g, '        ')
  }
}

export default Service
