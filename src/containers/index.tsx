import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Background from './background'
import QuickInfo from './quick-info'

let background: React.Component
let quickInfo: React.Component

export function render($background: HTMLElement, $quickInfo: HTMLElement) {
  background = ReactDOM.render(<Background />, $background)
  quickInfo = ReactDOM.render(<QuickInfo />, $quickInfo)
}

export function setState(state: object) {
  background.setState(state)
  quickInfo.setState(state.quickInfo || {})
}
