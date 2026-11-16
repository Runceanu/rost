import { AvatarGroup } from './AvatarGroup'

// Figma's AvatarGroup: three shown, two more.
const people = ['Client One', 'Second Client', 'Third Client', 'Fourth Client', 'Fifth Client'].map((name) => ({ name }))
export const fixtures = [{ node: '744:48', name: 'avatar-group', element: <div style={{ display: 'flex', width: 'fit-content' }}><AvatarGroup people={people} /></div> }]

/** What a caller writes. Shown on the component's page. */
export const usage = `import { AvatarGroup } from 'rost/components/avatar-group/AvatarGroup'

<AvatarGroup people={team} max={3} />`

/** What the component's card on rost.build shows. */
export const preview = <AvatarGroup people={people} />
