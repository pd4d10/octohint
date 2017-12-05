import { h, render, Component } from 'preact'
import Background, { StateType as BackgroundStateType } from './background'
import QuickInfo, { StateType as QuickInfoStateType } from './quick-info'

let background: Component<undefined, BackgroundStateType>
let quickInfo: Component<undefined, QuickInfoStateType>

export function renderToDOM($background: HTMLElement, $quickInfo: HTMLElement) {
  render(<Background ref={(ref: any) => (background = ref)} />, $background)
  render(<QuickInfo ref={(ref: any) => (quickInfo = ref)} />, $quickInfo)
}

export function setState(state: BackgroundStateType) {
  background.setState(state)
  quickInfo.setState(state.quickInfo || {})
}
