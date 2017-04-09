import * as React from 'react'
import * as ReactDOM from 'react-dom'

const DEFINITION_COLOR = 'rgb(248, 238, 199)'
const QUICK_INFO_COLOR = 'rgba(173,214,255,.15)'

interface PropsTypes {}

interface StateType {
  occurrences: object[],
  isDefinitionVisible: boolean,
  definitionStyle: object,
  isQuickInfoVisible: boolean,
  quickInfoStyle: object
}

class Header extends React.Component<PropsTypes, StateType> {
  state = {
    occurrences: [],
    isDefinitionVisible: false,
    definitionStyle: {},
    isQuickInfoVisible: false,
    quickInfoStyle: {}
  }

  render() {
    const { state } = this
    return (
      <div>
        <div
          style={{
            position: 'absolute',
            background: DEFINITION_COLOR,
            ...state.definitionStyle,
            display: state.isDefinitionVisible ? 'block' : 'none',
          }}
        />
        <div
          style={{
            background: QUICK_INFO_COLOR,
            lineHeight: '20px',
            // FIXME: Get line height from actual DOM
            ...state.quickInfoStyle,
            display: state.isQuickInfoVisible ? 'block' : 'none'
          }}
        />
        {state.occurrences.map((occurrence, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              ...occurrence
            }}
          />
        ))}
      </div>
    )
  }
}

export default function render($dom: HTMLElement) {
  return ReactDOM.render(<Header />, $dom)
}
