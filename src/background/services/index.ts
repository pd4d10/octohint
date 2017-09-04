import Service from './service'
import { isTsFile, getExtension } from '../../utils'
import TSService from './typescript'
import HTMLService from './html'
import { CSSService, LESSService, SCSSService } from './css'
import SimpleService from './simple'
// import JSONService from './json'

let tsService: TSService

function getServiceByFileName(fileName: string) {
  const ext = getExtension(fileName)
  switch (ext) {
    // case 'js':
    // case 'jsx':
    // case 'ts':
    // case 'tsx':
    //   return TSService
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
      return SimpleService
  }
}

export function createService(fileName: string, code: string) {
  if (isTsFile(fileName)) {
    console.log(tsService)
    if (tsService) {
      tsService.addFile(fileName, code)
    } else {
      tsService = new TSService(fileName, code)
    }
    return tsService
  }

  const LanguageService = getServiceByFileName(fileName)
  return new LanguageService(fileName, code)
}
