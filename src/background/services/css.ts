import * as cssService from 'vscode-css-languageservice'
import * as ls from 'vscode-languageserver-types'
import { SingleFileService } from './base'
import { PositionInfo } from '../../types'

abstract class BaseService extends SingleFileService {
  private service!: cssService.LanguageService
  private document!: ls.TextDocument
  private stylesheet!: cssService.Stylesheet
  abstract getService(): cssService.LanguageService

  createService(code: string) {
    const languageId = this.file.replace(/.*\.(.*?)$/, '$1')
    this.service = this.getService()
    this.document = ls.TextDocument.create(this.file, languageId, 0, code)
    this.stylesheet = this.service.parseStylesheet(this.document)
  }

  getOccurrences(info: PositionInfo) {
    return this.service
      .findDocumentHighlights(this.document, info, this.stylesheet)
      .map(highlight => ({
        range: highlight.range.start,
        width: highlight.range.end.character - highlight.range.start.character,
      }))
  }

  getDefinition(info: PositionInfo) {
    const definition = this.service.findDefinition(this.document, info, this.stylesheet)
    if (definition) {
      return definition.range.start
    }
  }

  getQuickInfo(info: PositionInfo) {
    const hover = this.service.doHover(this.document, info, this.stylesheet)
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
