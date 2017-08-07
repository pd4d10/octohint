// TODO: Add switch

import { h, Component } from 'preact'

interface PropsTypes {}

interface StateType {
  isOpen: boolean
}

class Switch extends Component<PropsTypes, StateType> {
  state: StateType = {
    isOpen: true,
  }

  render() {
    return (
      <div
        style={this.state.isOpen ? {} : { color: '#aaa' }}
        onClick={() =>
          this.setState((previousState: any) => ({
            isOpen: !previousState.isOpen,
          }))}
      >
        Octohint
      </div>
    )
  }
}

// export default function renderSwitch($dom: HTMLElement) {
//   return ReactDOM.render(<Switch />, $dom)
// }
