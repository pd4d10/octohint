import ts from 'typescript'

export interface Occurrence {
  isWriteAccess?: boolean
  range: ts.LineAndCharacter
  width: number
}

export interface QuickInfo {
  info: ts.SymbolDisplayPart[] | string
  range: ts.LineAndCharacter
  width: number
}

export type Definition = ts.LineAndCharacter

type Position = {
  x: number
  y: number
}

export interface BackgroundMessage {
  occurrences?: Occurrence[]
  info?: ts.LineAndCharacter
  data?: QuickInfo
}

// Message from Content Script
interface BaseContentMessage {
  file: string
  codeUrl: string
  tabSize: number
}

interface ContentMessageOfOccurrence extends BaseContentMessage {
  type: 'occurrence'
  position: Position
  meta?: boolean
}

interface ContentMessageOfQuickInfo extends BaseContentMessage {
  type: 'quickInfo'
  position: Position
}

export type ContentMessage = ContentMessageOfOccurrence | ContentMessageOfQuickInfo

export interface PositionInfo {
  file: string
  line: number
  character: number
}
