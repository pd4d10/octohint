// FIXME: Add types
// import gitHubInjection from 'github-injection'
declare var require: any
const gitHubInjection = require('github-injection')
import { main } from './dom'

gitHubInjection(window, (err: Error) => {
  if (err) throw err
  main()
})

// TODO: Add a button to turn off
// TODO: Multi language support
// TODO: Async load
// TODO: Do not excute 13M+ JS every time, save as a worker
// TODO: Dark theme
// TODO: Refactor with React since view is data driven
