const fs = require('fs')
const path = require('path')
const svg2png = require('svg2png')

const icons = fs.readdirSync('./src/icons')
icons.forEach(icon => {
  svg2png(fs.readFileSync(path.resolve('./src/icons', icon)))
    .then(buffer => {
      fs.writeFileSync(path.resolve('./chrome/icons', icon.replace('.svg', '.png')), buffer)
    })
    .catch(console.log)
})
