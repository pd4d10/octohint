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

// TODO:
export function getTabSizeFromEditorConfig(config: string) {
  const lines = config.split('\n')
  for (const line of lines) {
    if (line.includes('indent_size')) {
      const value = line.split('=')[1].trim()
      return parseInt(value, 10)
    }
  }
}
