import * as ts from 'typescript'
import TSService from './typescript'
import HTMLService from './html'
import { CSSService, LESSService, SCSSService } from './css'

export default function createService(fileName: string, code: string) {
  switch (fileName.replace(/.*\.(.*?)$/, '$1')) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return new TSService(fileName, code)
    case 'less':
      return new LESSService(fileName, code)
    case 'scss':
      return new SCSSService(fileName, code)
    case 'css':
      return new CSSService(fileName, code)
    case 'html':
      return new HTMLService(fileName, code)
    default:
      throw new Error('No such service')
  }
}
