// import OtherService from './service'
import { isTsFile, getExtension } from '../../utils'
import HTMLService from './html'
import { CSSService, LESSService, SCSSService } from './css'
import SimpleService from './simple'

function getServiceByFileName(fileName: string) {
  const ext = getExtension(fileName)
  switch (ext) {
    case 'less':
      return LESSService
    case 'scss':
      return SCSSService
    case 'css':
      return CSSService
    case 'html':
      return HTMLService
    default:
      return SimpleService
  }
}

export function createService(fileName: string, codeUrl: string, editorConfigUrl?: string) {
  const Service = getServiceByFileName(fileName)
  return new Service(fileName, codeUrl, editorConfigUrl)
}
