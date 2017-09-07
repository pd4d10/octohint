import * as jsonService from 'vscode-json-languageservice'
import * as ls from 'vscode-languageserver-types'
import OtherService from './service'

export default class JSONService extends OtherService {
  private _languageService = jsonService.getLanguageService({})
  private _document: ls.TextDocument
  private _htmlDocument = this._languageService.parseJSONDocument(this._document)

  createService(code: string) {
    this._document = ls.TextDocument.create(this.fileName, 'json', 0, code)
  }

  getOccurrences(line: number, character: number) {}

  getDefinition(line: number, character: number) {}

  getQuickInfo(line: number, character: number) {}
}
