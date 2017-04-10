import * as React from 'react'

export interface State {
  isVisible: boolean,
  info: string,
  top: number,
  left: number,
}

export default class QuickInfo extends React.Component<undefined, State> {
  state = {
    isVisible: false,
    info: '',
    top: 0,
    left: 0
  }

  render() {
    const { state } = this
    return (
      <div
        style={{
          display: state.isVisible ? 'block' : 'none',
          zIndex: 1,
          position: 'relative',
          background: '#eee',
          border: '1px solid #aaa',
          fontSize: '12px',
          padding: '4px',
          lineHeight: 1,
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          // FIXME: Get font family from actual DOM
          top: state.top - 22,
          left: state.left,
          minWidth: '100%',
        }}
      >{state.info}</div>
    )
  }
}
