import { h, Component } from 'preact'

const builtInPermissions = [
  'https://bitbucket.org/*',
  'https://gist.github.com/*',
  'https://gitlab.com/*',
  'https://github.com/*',
]

export default class Options extends Component<{}, { origins: string[]; temp: string }> {
  state = {
    origins: [],
    temp: '',
  }

  constructor() {
    super()
    chrome.permissions.getAll(({ origins = [] }) => {
      this.setState({
        origins,
      })
    })
  }

  handleChange = (e: Event) => {
    this.setState({
      temp: (e.target as HTMLInputElement).value,
    })
  }

  handleAdd = (e: Event) => {
    e.preventDefault()
    const { origins, temp } = this.state
    if (!temp) {
      alert('fail')
      return
    }
    chrome.permissions.request({ origins: [temp] }, granted => {
      if (granted) {
        chrome.permissions.getAll(({ origins = [] }) => {
          this.setState({
            origins,
            temp: '',
          })
        })
      }
    })
  }

  handleRemove = (origin: string) => {
    chrome.permissions.remove({ origins: [origin] }, removed => {
      if (removed) {
        chrome.permissions.getAll(({ origins = [] }) => {
          this.setState({
            origins,
          })
        })
      }
    })
  }

  render() {
    return (
      <div style={{ lineHeight: '1.8' }}>
        <form onSubmit={this.handleAdd}>
          <p>
            Add permissions here if your GitHub/Gitlab/Bitbucket is hosted on a different site. If it doesn't work, see{' '}
            <a href="https://developer.chrome.com/extensions/match_patterns">Match Patterns</a>
          </p>
          <table>
            <thead />
            <tbody>
              <tr>
                <td>
                  <input
                    style={{ minWidth: '200px' }}
                    type="text"
                    value={this.state.temp}
                    onChange={this.handleChange}
                    placeholder="https://www.example.com/*"
                  />
                </td>
                <td>
                  <button type="submit">Add</button>
                </td>
              </tr>
              {this.state.origins.map(origin => (
                <tr key={origin}>
                  <td style={{ minWidth: '220px' }}>{origin}</td>
                  <td>
                    {builtInPermissions.includes(origin) || (
                      <a href="#" onClick={() => this.handleRemove(origin)}>
                        Remove
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
        <hr />
        <footer>
          <a href="https://github.com/pd4d10/octohint">Source code</a>
          <br />
          <a href="https://github.com/pd4d10/octohint/issues/new">Submit an issue</a>
        </footer>
      </div>
    )
  }
}
