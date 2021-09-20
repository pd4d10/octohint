import { LanguageService, Stylesheet, TextDocument, MarkupContent } from 'vscode-css-languageservice'
import { BaseService } from './base'
import { HintRequest } from '../types'

export class CssService extends BaseService {
  private document: TextDocument
  private stylesheet: Stylesheet

  constructor(public service: LanguageService, file: string, ext: string, code: string) {
    super()
    this.document = TextDocument.create(file, ext, 0, code)
    this.stylesheet = this.service.parseStylesheet(this.document)
  }

  getOccurrences(req: HintRequest) {
    return this.service.findDocumentHighlights(this.document, req, this.stylesheet).map((highlight) => ({
      range: highlight.range.start,
      width: highlight.range.end.character - highlight.range.start.character,
    }))
  }

  getDefinition(req: HintRequest) {
    return this.service.findDefinition(this.document, req, this.stylesheet)?.range.start
  }

  getQuickInfo(req: HintRequest) {
    const hover = this.service.doHover(this.document, req, this.stylesheet)
    if (hover?.contents && hover?.range && MarkupContent.is(hover.contents)) {
      // TODO: deprecate MarkedString
      return {
        info: [
          {
            kind: hover.contents.kind,
            text: hover.contents.value,
          },
        ],
        range: hover.range.start,
        width: hover.range.end.character - hover.range.start.character,
      }
    }
  }
}
