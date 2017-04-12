import { h, render, Component } from 'preact'
import Background from './background'
import QuickInfo from './quick-info'

let background: Component
let quickInfo: Component

export function renderToDOM($background: HTMLElement, $quickInfo: HTMLElement) {
  render(<Background ref={ref => background = ref} />, $background)
  render(<QuickInfo ref={ref => quickInfo = ref} />, $quickInfo)
}

export function setState(state: object) {
  background.setState(state)
  quickInfo.setState(state.quickInfo || {})
}
