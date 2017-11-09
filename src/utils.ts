export function getExtension(path: string) {
  return path.replace(/.*\.(.*?)$/, '$1')
}

export function isTsFile(path: string) {
  return ['ts', 'tsx', 'js', 'jsx'].includes(getExtension(path))
}

// TODO: GitLab and Bitbucket
export function getRawUrl(url: string) {
  return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
}

export function getEditorConfigUrl(url: string) {
  return url.replace(/(github.com\/.*?\/.*?)\/.*/, '$1')
}

export function getFullLibName(name: string) {
  return `/node_modules/${name}/index.d.ts`
}
