export const toStyleText = (obj: { [key: string]: string }) => {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}

export const colors = {
  lineBg: '#fffbdd',
  quickInfoBg: 'rgba(173,214,255,.3)',
  occurrenceWrite: 'rgba(14,99,156,.4)',
  occurrenceRead: 'rgba(173,214,255,.7)',
}
