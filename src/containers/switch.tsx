import * as React from 'react'
import * as ReactDOM from 'react-dom'

interface PropsTypes {}

interface StateType {
  isOpen: boolean
}

class Switch extends React.Component<PropsTypes, StateType> {
  state: StateType = {
    isOpen: true
  }

  render() {
    return (
      <div
        style={this.state.isOpen ? {} : { color: '#aaa' }}
        onClick={() => this.setState(previousState => ({
          isOpen: !previousState.isOpen
        }))}
      >Intelli Octo</div>
    )
  }
}

export default function renderSwitch($dom: HTMLElement) {
  return ReactDOM.render(<Switch />, $dom)
}
