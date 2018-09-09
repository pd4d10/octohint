import { CSSService, LESSService, SCSSService } from './css'
import SimpleService from './simple'
// import VueService from './vue'

function getServiceByFileName(ext: string) {
  switch (ext) {
    case 'less':
      return LESSService
    case 'scss':
      return SCSSService
    case 'css':
      return CSSService
    // case 'vue':
    //   return VueService
    default:
      return SimpleService
  }
}

export function createService(ext: string, fileName: string, codeUrl: string) {
  const Service = getServiceByFileName(ext)
  return new Service(fileName, codeUrl)
}
