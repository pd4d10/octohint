import { h, render, Component } from 'preact'

class Options extends Component<undefined, undefined> {
  state = {
    origins: [],
    temp: '',
  }

  constructor(props) {
    super(props)
    chrome.permissions.getAll(({ origins }) => {
      this.setState({
        origins,
      })
    })
  }

  handleChange = (e) => {
    this.setState({
      temp: e.target.value
    })
  }

  handleAdd = () => {
    const { origins, temp } = this.state
    if (!temp) {
      alert('fail')
      return
    }

    chrome.permissions.request({ origins: [`${temp}/*`] }, granted => {
      if (granted) {
        chrome.permissions.getAll(({ origins }) => {
          this.setState({
            origins,
            temp: '',
          })
        })
      }
    })
  }

  // TODO: Remove origin
  render() {
    return (
      <div>
        <label>Add another website:</label>
        <input type='text' value={this.state.temp} onChange={this.handleChange} />
        <button onClick={this.handleAdd}>Add</button>
        <ul>
          {this.state.origins.map(origin => <li key={origin}>{origin}</li>)}
        </ul>
      </div>
    )
  }
}

render(<Options />, document.body)
