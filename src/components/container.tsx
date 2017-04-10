import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Occurrence, { OccurrenceProps } from './occurrence'
import Definition, { DefinitionProps } from './definition'
import QuickInfo, { QuickInfoProps } from './quick-info'

interface PropsTypes {}

interface StateType {
  occurrences: OccurrenceProps[],
  definition: DefinitionProps,
  quickInfo: QuickInfoProps
}

class Container extends React.Component<PropsTypes, StateType> {
  state = {
    occurrences: [],
    definition: {
      isVisible: false,
      height: 0,
      width: 0,
      top: 0
    },
    quickInfo: {
      isVisible: false,
      info: '',
      top: 0,
      left: 0
    }
  }

  render() {
    const { state } = this
    return (
      <div>
        <Definition {...state.definition} />
        {state.occurrences.map((occurrence, i) => (
          <Occurrence key={i} {...occurrence} />
          // FIXME: Key should not be index
        ))}
        <QuickInfo {...state.quickInfo} />
      </div>
    )
  }
}

export default function render($dom: HTMLElement) {
  return ReactDOM.render(<Container />, $dom)
}
