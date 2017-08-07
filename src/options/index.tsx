import { h, render } from 'preact'
import Options from './options'

const container = document.createElement('div')
document.body.appendChild(container)
render(<Options />, container)
