#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')

// Get all lib names from DefinitelyTyped repo
// https://github.com/DefinitelyTyped/DefinitelyTyped
async function main() {
  //   const res = await fetch('https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/master/notNeededPackages.json')
  //   const { packages } = await res.json()
  try {
    const r0 = await fetch('https://api.github.com/repos/DefinitelyTyped/DefinitelyTyped/git/trees/master')
    const { tree: t0 } = await r0.json()
    const { url } = t0.filter(({ path }) => path === 'types')[0]
    const r1 = await fetch(url)
    const { tree: t1 } = await r1.json()
    const libs = t1.map(({ path }) => path)

    fs.writeFileSync(path.resolve(__dirname, '../src/libs.json'), JSON.stringify(libs))
  } catch (err) {
    console.log(err)
  }
}

main()
