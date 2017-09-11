import * as cssService from 'vscode-css-languageservice'
import * as ls from 'vscode-languageserver-types'
import { Service, OtherService } from './service'

abstract class BaseService extends OtherService implements Service {
  private _languageService: cssService.LanguageService
  private _document: ls.TextDocument
  private _stylesheet: cssService.Stylesheet
  abstract getService(): cssService.LanguageService

  createService(code: string) {
    const languageId = this.fileName.replace(/.*\.(.*?)$/, '$1')
    this._languageService = this.getService()
    this._document = ls.TextDocument.create(this.fileName, languageId, 0, code)
    this._stylesheet = this._languageService.parseStylesheet(this._document)
  }

  getOccurrences(name: string, line: number, character: number) {
    return this._languageService
      .findDocumentHighlights(this._document, { line, character }, this._stylesheet)
      .map(highlight => ({
        range: highlight.range.start,
        width: highlight.range.end.character - highlight.range.start.character,
      }))
  }

  getDefinition(name: string, line: number, character: number) {
    const definition = this._languageService.findDefinition(this._document, { line, character }, this._stylesheet)
    return definition.range.start
  }

  getQuickInfo(name: string, line: number, character: number) {
    const hover = this._languageService.doHover(this._document, { line, character }, this._stylesheet)
    if (hover && hover.contents && hover.range) {
      // TODO: Show all information
      let info: string
      if (typeof hover.contents === 'string') {
        info = hover.contents
      } else if (Array.isArray(hover.contents)) {
        const str = hover.contents[0]
        if (typeof str === 'string') {
          info = str
        } else {
          return
        }
      } else {
        return
      }

      return {
        info,
        range: hover.range.start,
        width: hover.range.end.character - hover.range.start.character,
      }
    }
  }
}

export class CSSService extends BaseService {
  getService() {
    return cssService.getCSSLanguageService()
  }
}

export class LESSService extends BaseService {
  getService() {
    return cssService.getLESSLanguageService()
  }
}

export class SCSSService extends BaseService {
  getService() {
    return cssService.getSCSSLanguageService()
  }
}
