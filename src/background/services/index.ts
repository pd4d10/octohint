// import OtherService from './service'
import { isTsFile, getExtension } from '../../utils'
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
    default:
      return SimpleService
  }
}

export function createService(fileName: string, codeUrl: string, editorConfigUrl?: string) {
  const Service = getServiceByFileName(fileName)
  return new Service(fileName, codeUrl, editorConfigUrl)
}
