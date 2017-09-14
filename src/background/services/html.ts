import * as htmlService from 'vscode-html-languageservice'
import * as ls from 'vscode-languageserver-types'
import { SingleFileService, Service } from './service'

export default class HTMLService extends SingleFileService implements Service {
  private _languageService = htmlService.getLanguageService()
  private _document: ls.TextDocument
  private _htmlDocument = this._languageService.parseHTMLDocument(this._document)

  createService(code: string) {
    this._document = ls.TextDocument.create(this.fileName, 'html', 0, code)
  }

  getOccurrences(name: string, line: number, character: number) {
    return this._languageService
      .findDocumentHighlights(this._document, { line, character }, this._htmlDocument)
      .map(highlight => ({
        range: highlight.range.start,
        width: highlight.range.end.character - highlight.range.start.character,
      }))
  }

  getDefinition() {}
  getQuickInfo() {}
}
