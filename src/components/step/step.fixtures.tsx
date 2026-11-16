import { Step } from './Step'

// One fixture per Figma variant, in an <ol> as a Step always is.
const NODES = ['744:16', '744:21', '744:25']
export const fixtures = (['done', 'current', 'upcoming'] as const).map((status, i) => ({
  node: NODES[i],
  name: `status=${status}`,
  element: <ol style={{ display: 'flex', width: 'fit-content', margin: 0, padding: 0, listStyle: 'none' }}><Step status={status} number={i + 1}>{['Details', 'Bank', 'Review'][i]}</Step></ol>,
}))
