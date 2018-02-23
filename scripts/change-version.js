// Sepcific a new version, like 2.0.1 -> 2.0.2

const fs = require('fs')

const version = process.argv[2]

if (!version) {
  throw Error('No version specified')
}

;['chrome/manifest.json', 'package.json'].forEach(file => {
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/"version": "\d.\d.\d"/, `"version": "${version}"`))
})
;['octohint.safariextension/Info.plist'].forEach(file => {
  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf8').replace(/<string>\d.\d.\d<\/string>/, `<string>${version}</string>`)
  )
})
