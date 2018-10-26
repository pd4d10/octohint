import * as ts from 'typescript'

export type Range = ts.LineAndCharacter

export interface Occurrence {
  isWriteAccess?: boolean
  range: Range
  width: number
}

export interface QuickInfo {
  info: ts.SymbolDisplayPart[] | string
  range: Range
  width: number
}

export type Definition = ts.LineAndCharacter

type Position = {
  x: number
  y: number
}

export enum Message {
  service = 'service',
  occurrence = 'occurrence',
  quickInfo = 'quickInfo',
}

// Message from background
// interface BackgroundMessageBase {}

interface BackgroundMessageOfService {}

export interface BackgroundMessageOfOccurrence {
  occurrences: Occurrence[]
  info?: Range
}

export interface BackgroundMessageOfQuickInfo {
  data: QuickInfo
}

interface BackgroundMessageOfError {
  error: string
}

export type MessageFromBackground =
  | BackgroundMessageOfService
  | BackgroundMessageOfOccurrence
  | BackgroundMessageOfQuickInfo
  | BackgroundMessageOfError

// Message from Content Script
interface BaseContentMessage {
  file: string
  codeUrl: string
  tabSize: number
}

interface ContentMessageOfService extends BaseContentMessage {
  type: Message.service
}

interface ContentMessageOfOccurrence extends BaseContentMessage {
  type: Message.occurrence
  position: Position
  meta?: boolean
}

interface ContentMessageOfQuickInfo extends BaseContentMessage {
  type: Message.quickInfo
  position: Position
}

export type MessageFromContentScript = ContentMessageOfService | ContentMessageOfOccurrence | ContentMessageOfQuickInfo

export type SendMessageToBackground = (
  data: MessageFromContentScript,
  cb: (message: MessageFromBackground) => void,
) => void

export type AddBackgroundListener = (
  listener: (message: MessageFromContentScript, sendResponse: (message: MessageFromBackground) => void) => void,
) => void
