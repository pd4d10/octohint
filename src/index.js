import ts from 'typescript'

const w = 7.223
const fileheadheight = 43
const gutterwidth = 60
const lineheight = 20

function getPosition(e, $dom) {
  const rect = $dom.getBoundingClientRect()
  // console.log(e.clientX, e.clientY, rect)
  return {
    x: Math.floor((e.clientX - rect.left - gutterwidth) / w),
    y: Math.floor((e.clientY - rect.top) / lineheight)
  }
}

function visit(source, pos) {
}

function check(node, pos, cb) {
  if (node.pos <= pos && pos < node.end) {
    console.log(node)
    if (node.kind === 70) {
      return cb(node)
    }

    ts.forEachChild(node, n => check(n, pos, cb))
  }
}

function checkPromise(node, pos) {
  return new Promise(resolve => {
    check(node, pos, resolve)
  })
}

function draw(range, width) {
  const $mask = document.createElement('div')
  $mask.style = `position:absolute;width:${width * w}px;height:20px;top:${range.line * 20 + fileheadheight}px;left:${range.character * w + gutterwidth}px;background:rgba(0,0,255,0.3)`
  const $container = document.querySelector('.blob-wrapper')
  $container.appendChild($mask)
}

function main() {
  const $dom = document.querySelector('table')
  if (!$dom) {
    return
  }

  const code = $dom.innerText
  const source = ts.createSourceFile('index.js', code)

  $dom.addEventListener('click', async function (e) {
    const position = getPosition(e, $dom)
    const pos = source.getPositionOfLineAndCharacter(position.y, position.x)
    // console.log(source)
    const identifier = await checkPromise(source, pos)
    // console.log(pos)
    const range = source.getLineAndCharacterOfPosition(identifier.pos)
    console.log(range)
    const width = identifier.end - identifier.pos
    draw(range, width)
  })
}

main()
