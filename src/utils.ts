export function getExtension(path: string) {
  return path.replace(/.*\.(.*?)$/, '$1')
}

export function isTsFile(path: string) {
  return ['ts', 'tsx', 'js', 'jsx'].includes(getExtension(path))
}
