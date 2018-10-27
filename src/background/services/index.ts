import { CSSService, LESSService, SCSSService } from './css'
import SimpleService from './simple'
import * as types from '../../types'
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

export function createService(ext: string, message: types.ContentMessage) {
  const Service = getServiceByFileName(ext)
  return new Service(message)
}
