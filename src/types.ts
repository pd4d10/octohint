import { LineAndCharacter, SymbolDisplayPart } from 'typescript'

export type Range = LineAndCharacter

export interface Occurrence {
  isWriteAccess?: boolean
  range: Range
  width: number
}

export interface QuickInfo {
  info: SymbolDisplayPart[] | string
  range: Range
  width: number
}

export type Definition = LineAndCharacter

export interface Position {
  x: number
  y: number
}

export enum MessageType {
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
  editorConfigUrl?: string
}

interface ContentMessageOfService extends BaseContentMessage {
  type: MessageType.service
}

interface ContentMessageOfOccurrence extends BaseContentMessage {
  type: MessageType.occurrence
  position: Position
  meta?: boolean
}

interface ContentMessageOfQuickInfo extends BaseContentMessage {
  type: MessageType.quickInfo
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
