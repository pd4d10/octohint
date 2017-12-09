export function getExtension(path: string) {
  return path.replace(/.*\.(.*?)$/, '$1')
}

export function isTsFile(path: string) {
  return ['ts', 'tsx', 'js', 'jsx'].includes(getExtension(path))
}

export const colors = {
  definitionHighlight: '#fffbdd',
  quickInfoBackground: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}
