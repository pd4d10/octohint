import * as React from 'react'
import * as ReactDOM from 'react-dom'

const DEFINITION_COLOR = 'rgb(248, 238, 199)'

interface PropsTypes {}

interface StateType {
  isVisible: boolean,
  info: string,
  style: object,
}

class Footer extends React.Component<PropsTypes, StateType> {
  state: StateType = {
    isVisible: false,
    info: '',
    style: {}
  }

  render() {
    const { state } = this
    return (
      <div
        style={{
          display: state.isVisible ? 'block' : 'none',
          position: 'absolute',
          background: '#eee',
          border: '1px solid #aaa',
          fontSize: '12px',
          padding: '4px',
          lineHeight: 1,
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
          // FIXME: Get font family from actual DOM
          ...state.style,
        }}
      >{state.info}</div>
    )
  }
}

export default function render($dom: HTMLElement) {
  return ReactDOM.render(<Footer />, $dom)
}
