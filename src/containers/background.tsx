import { h, Component } from 'preact'
import Occurrence, { OccurrenceProps } from '../components/occurrence'
import Definition, { DefinitionProps } from '../components/definition'
import QuickInfoBackground, { QuickInfoBackgroundProps } from '../components/quick-info-background'

interface StateType {
  occurrences: OccurrenceProps[],
  definition: DefinitionProps,
  QuickInfoBackground: QuickInfoBackgroundProps
}

export default class Background extends Component<undefined, StateType> {
  state = {
    occurrences: [],
    definition: {
      isVisible: false,
      height: 0,
      width: 0,
      top: 0
    },
    QuickInfoBackground: {
      isVisible: false,
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
        <QuickInfoBackground {...state.QuickInfoBackground} />
      </div>
    )
  }
}
