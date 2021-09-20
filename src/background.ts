import { getCSSLanguageService, getLESSLanguageService, getSCSSLanguageService } from 'vscode-css-languageservice'
import { createDefaultMapFromCDN, createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs'
import { TsService } from './services/typescript'
import { BaseService } from './services/base'
import { HintRequest, HintResponse } from './types'
import { CssService } from './services/css'
import SimpleService from './services/simple'
import ts from 'typescript'

let tsService: TsService | undefined

async function initTsService() {
  if (tsService) return

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020, // TODO: latest, and node.js libs
    allowJs: true,
  }

  const files = await createDefaultMapFromCDN(
    compilerOptions,
    ts.version,
    false,
    ts,
    undefined,
    fetch,
    {} as any // TODO:
  )

  const system = createSystem(files)
  const env = createVirtualTypeScriptEnvironment(system, [], ts, compilerOptions)

  tsService = new TsService(system, env)
}

const services = {} as { [file: string]: BaseService }

function handleRequest(req: HintRequest): HintResponse {
  let service: BaseService | undefined
  const ext = req.file.split('.').slice(-1)[0]

  if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
    // TODO: mjs, cjs
    initTsService()
    tsService?.addFile(req)
    service = tsService
  } else {
    if (!services[req.file]) {
      if (ext === 'less') {
        service = new CssService(getLESSLanguageService(), req)
      } else if (ext === 'scss') {
        service = new CssService(getSCSSLanguageService(), req)
      } else if (ext === 'css') {
        service = new CssService(getCSSLanguageService(), req)
      } else {
        service = new SimpleService(req)
      }

      services[req.file] = service
    }

    service = services[req.file]
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
