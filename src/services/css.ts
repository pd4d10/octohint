import { LanguageService, Stylesheet } from 'vscode-css-languageservice'
import * as ls from 'vscode-languageserver-types'
import { BaseService } from './base'
import { HintRequest } from '../types'

export class CssService extends BaseService {
  private document: ls.TextDocument
  private stylesheet: Stylesheet

  constructor(public service: LanguageService, req: HintRequest) {
    super()
    this.document = ls.TextDocument.create(
      req.file,
      req.file.replace(/.*\.(.*?)$/, '$1'),
      0,
      req.codeUrl,
    )
    this.stylesheet = this.service.parseStylesheet(this.document)
  }

  getOccurrences(req: HintRequest) {
    return this.service
      .findDocumentHighlights(this.document, req, this.stylesheet)
      .map((highlight) => ({
        range: highlight.range.start,
        width: highlight.range.end.character - highlight.range.start.character,
      }))
  }

  getDefinition(req: HintRequest) {
    return this.service.findDefinition(this.document, req, this.stylesheet)?.range.start
  }

  getQuickInfo(req: HintRequest) {
    const hover = this.service.doHover(this.document, req, this.stylesheet)
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
