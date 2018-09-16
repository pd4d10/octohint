// Sepcific a new version, like 2.0.1 -> 2.0.2

const fs = require('fs')
const { spawnSync } = require('child_process')

const version = process.argv[2]

if (!version) {
  throw Error('No version specified')
}

const files = ['package.json', 'chrome/manifest.json', 'octohint.safariextension/Info.plist']

files.slice(0, 2).forEach(file => {
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/"version": "\d.\d.\d"/, `"version": "${version}"`))
})
fs.writeFileSync(
  files[2],
  fs.readFileSync(files[2], 'utf8').replace(/<string>\d.\d.\d<\/string>/, `<string>${version}</string>`),
)

spawnSync('git', ['add', ...files])
spawnSync('git', ['commit', '-m', version])
spawnSync('git', ['tag', 'v' + version])
