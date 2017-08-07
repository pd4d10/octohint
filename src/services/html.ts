import * as htmlService from 'vscode-html-languageservice'
import * as ls from 'vscode-languageserver-types'
import Service from './service'

export default class HTMLService extends Service {
  private _languageService = htmlService.getLanguageService()
  private _document: ls.TextDocument
  private _htmlDocument = this._languageService.parseHTMLDocument(
    this._document
  )

  createService(code: string) {
    this._document = ls.TextDocument.create(this.fileName, 'html', 0, code)
  }

  getOccurrences(line: number, character: number) {
    const occurrences = this._languageService.findDocumentHighlights(
      this._document,
      { line, character },
      this._htmlDocument
    )
    return occurrences.map(occurrence => ({
      range: occurrence.range.start,
      width: occurrence.range.end.character - occurrence.range.start.character,
    }))
  }

  getDefinition(line: number, character: number) {}

  getQuickInfo(line: number, character: number) {}
}
