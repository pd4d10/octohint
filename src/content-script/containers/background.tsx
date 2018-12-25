import { h, Component } from 'preact'
import Occurrence, { OccurrenceProps } from '../components/occurrence'
import Definition, { DefinitionProps } from '../components/definition'
import QuickInfoBackground, { QuickInfoBackgroundProps } from '../components/quick-info-background'

export interface StateType {
  occurrences: OccurrenceProps[]
  definition: DefinitionProps
  quickInfo: QuickInfoBackgroundProps
}

export default class Background extends Component<{ ref: (ref: any) => any }, StateType> {
  state = {
    occurrences: [],
    definition: {
      visible: false,
      height: 0,
      width: 0,
      top: 0,
    },
    quickInfo: {
      visible: false,
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    },
  }

  render() {
    const { state } = this
    return (
      <div>
        <Definition {...state.definition} />
        {state.occurrences.map(occurrence => (
          <Occurrence {...occurrence} />
        ))}
        <QuickInfoBackground {...state.quickInfo} />
      </div>
    )
  }
}
