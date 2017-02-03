import ts from 'typescript'
import './style.css'

const w = 7.223
const fileheadheight = 43
const gutterwidth = 60
const lineheight = 20
const CLASS_NAME = 'github-intellisense'

function getPosition(e, $dom) {
  const rect = $dom.getBoundingClientRect()
  // console.log(e.clientX, e.clientY, rect)
  return {
    x: Math.floor((e.clientX - rect.left - gutterwidth) / w),
    y: Math.floor((e.clientY - rect.top) / lineheight)
  }
}

// function visit(source, pos) {
// }

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

// Clear all
function clear() {
  document.querySelectorAll(`.${CLASS_NAME}`).forEach($node => $node.remove())
}

function draw(range, width, className) {
  const $mask = document.createElement('div')

  // Set style
  $mask.className = `${CLASS_NAME} ${className}`
  $mask.style.width = `${width * w}px`
  $mask.style.top = `${range.line * 20 + fileheadheight}px`
  $mask.style.left = `${range.character * w + gutterwidth}px`

  // Append
  const $container = document.querySelector('.file')
  $container.appendChild($mask)
}

function drawDefinition(range, width) {
  return draw(range, width, 'github-intellisense-definition')
}

function drawUsage(range, width) {
  return draw(range, width, 'github-intellisense-usage')
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
    drawUsage(range, width)
  })
}

main()
