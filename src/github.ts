// FIXME: Add types
// import gitHubInjection from 'github-injection'
declare var require: any
const gitHubInjection = require('github-injection')
import { main } from './dom'

gitHubInjection(window, (err: Error) => {
  if (err) throw err
  main()
})

// TODO: Multi language support
