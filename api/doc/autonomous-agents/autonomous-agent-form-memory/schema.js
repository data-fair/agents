import { autonomousAgentFormPart } from '../autonomous-agent-form-part.js'

const part = autonomousAgentFormPart('memory', ['memory'])
// The tab is already called Memory: the section would repeat it.
part.properties.memory.layout = { title: null }

export default part
