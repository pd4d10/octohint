declare module 'preact-portal' {
  import { Component } from 'preact'

  export = Portal

  interface PortalProps {
    into: string | HTMLElement
  }

  class Portal extends Component<PortalProps, {}> {
    render(): any
  }
}
