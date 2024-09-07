import { HintRequest, HintResponse } from "../types";

export async function fetchWithCredentials(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`url fetch fails: ${url}`);
  }
  return res.text();
}

export abstract class BaseService {
  abstract getOccurrences(req: HintRequest): HintResponse["occurrences"];
  abstract getDefinition(req: HintRequest): HintResponse["definition"];
  abstract getQuickInfo(req: HintRequest): HintResponse["quickInfo"];
}
