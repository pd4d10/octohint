import { HintRequest, HintResponse } from '../types'

export async function fetchWithCredentials(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`url fetch fails: ${url}`)
  }
  return res.text()
}

export async function fetchCode(req: HintRequest): Promise<string> {
  const code = await fetchWithCredentials(req.codeUrl)
  return code.replace(/\t/g, ' '.repeat(req.tabSize))
}

export abstract class BaseService {
  abstract getOccurrences(req: HintRequest): HintResponse['occurrences']
  abstract getDefinition(req: HintRequest): HintResponse['definition']
  abstract getQuickInfo(req: HintRequest): HintResponse['quickInfo']
}
