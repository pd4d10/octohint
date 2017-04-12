import { h, Component } from 'preact'

export interface StateType {
  isVisible: boolean,
  info: string,
  left: number,
  fontFamily: string,
  infoTop: number,
}

export default class QuickInfo extends Component<undefined, StateType> {
  state = {
    isVisible: false,
    info: '',
    left: 0,
    fontFamily: 'monospace',
    infoTop: 0,
  }

  render() {
    const { state } = this
    return (
      <div
        style={{
          display: state.isVisible ? 'block' : 'none',
          position: 'relative',
          background: '#eee',
          border: '1px solid #aaa',
          fontSize: '12px',
          padding: '4px',
          lineHeight: 1,
          fontFamily: state.fontFamily,
          top: state.infoTop,
          left: state.left,
          minWidth: '100%',
        }}
      >{state.info}</div>
    )
  }
}
