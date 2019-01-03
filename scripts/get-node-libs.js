const fs = require('fs')
const path = require('path')

const types = fs.readFileSync('./node_modules/@types/node/index.d.ts', 'utf8')
const regex = /declare module ['|"](.*?)['|"]/g
const libs = types.match(regex).map(item => item.replace(regex, '$1'))

console.log(libs)

fs.writeFileSync('./src/background/services/node-libs.json', JSON.stringify(libs))
