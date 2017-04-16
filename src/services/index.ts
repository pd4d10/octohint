import * as ts from 'typescript'
import TSService from './typescript'
import HTMLService from './html'
import { CSSService, LESSService, SCSSService } from './css'
// import JSONService from './json'

function getServiceByFileName(ext: string) {
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return TSService
    case 'less':
      return LESSService
    case 'scss':
      return SCSSService
    case 'css':
      return CSSService
    case 'html':
      return HTMLService
    // case 'json':
    //   return new JSONService(fileName, code)
    default:
      throw new Error('No such service')
  }
}

export default function createService(fileName: string, code: string) {
  const ext = fileName.replace(/.*\.(.*?)$/, '$1')
  const LanguageService = getServiceByFileName(ext)
  return new LanguageService(fileName, code)
}
