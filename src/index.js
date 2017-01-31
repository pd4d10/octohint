import typescript from 'typescript'

function getPosition(e, $dom) {
  const rect = $dom.getBoundingClientRect()
  return {
    x: Math.floor((e.clientX - rect.left - 60) / 7.223),
    y: Math.floor((e.clientY - rect.top) / 20)
  }
}

function main() {
  const $dom = document.querySelector('table')
  if (!$dom) {
    return
  }

  const code = $dom.innerText

  $dom.addEventListener('click', function (e) {
    const position = getPosition(e, $dom)
    // console.log(e)
    // console.log(e.offsetX, e.offsetY)
    console.log(position)
  })
}

main()
