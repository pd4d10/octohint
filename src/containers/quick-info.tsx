import { h, Component } from 'preact'

export interface StateType {
  isVisible: boolean,
  info: string,
  top: number,
  left: number,
  fontFamily: string,
}

export default class QuickInfo extends Component<undefined, StateType> {
  state = {
    isVisible: false,
    info: '',
    top: 0,
    left: 0,
    fontFamily: 'monospace'
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
          top: state.top - 22,
          left: state.left,
          minWidth: '100%',
        }}
      >{state.info}</div>
    )
  }
}
