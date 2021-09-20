import { getCSSLanguageService, getLESSLanguageService, getSCSSLanguageService } from 'vscode-css-languageservice'
import { createDefaultMapFromCDN, createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs'
import { TsService } from './services/typescript'
import { BaseService } from './services/base'
import { HintRequest, HintResponse } from './types'
import { CssService } from './services/css'
import SimpleService from './services/simple'
import ts from 'typescript'
import path from 'path'
import 'webext-dynamic-content-scripts'
import addDomainPermissionToggle from 'webext-domain-permission-toggle'

addDomainPermissionToggle()

let tsService: TsService | undefined
const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2020, // TODO: latest, and node.js libs
  allowJs: true,
}

// init ts service, async
createDefaultMapFromCDN(
  compilerOptions,
  ts.version,
  false,
  ts,
  undefined,
  fetch,
  {} as any // TODO:
).then((files) => {
  const system = createSystem(files)
  const env = createVirtualTypeScriptEnvironment(system, [], ts, compilerOptions)
  tsService = new TsService(system, env)
})

const serviceMap = new Map<string, BaseService>()

function handleRequest(req: HintRequest): HintResponse {
  let service: BaseService | undefined
  const ext = path.extname(req.file).slice(1)

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    // TODO: mjs, cjs
    tsService?.addFile(req) // async
    service = tsService
  } else {
    if (!serviceMap.has(req.file)) {
      if (ext === 'less') {
        service = new CssService(getLESSLanguageService(), req.file, ext, req.code)
      } else if (ext === 'scss') {
        service = new CssService(getSCSSLanguageService(), req.file, ext, req.code)
      } else if (ext === 'css') {
        service = new CssService(getCSSLanguageService(), req.file, ext, req.code)
      } else {
        service = new SimpleService(req.code)
      }

      serviceMap.set(req.file, service)
    }

    service = serviceMap.get(req.file)
  }

  if (req.type === 'click') {
    return {
      occurrences: service?.getOccurrences(req),
      definition: req.meta ? service?.getDefinition(req) : undefined,
    }
  } else if (req.type === 'hover') {
    return {
      quickInfo: service?.getQuickInfo(req),
    }
  } else {
    return {}
    // chrome.browserAction.setIcon({
    //   path: 'icon.png',
    // })
    // chrome.browserAction.setTitle({
    //   title: 'Octohint is active.',
    // })
  }

  // TODO: Do not set it every time
  // chrome.browserAction.setIcon({ tabId: sender.tab.id, path: 'icons/active.png' })
  // chrome.browserAction.setTitle({ title: 'Octohint works' })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log('runtime.onMessage', message, sender)
  // if (sender.tab?.id) {
  const res = handleRequest(message)
  sendResponse(res)
  // }
})
