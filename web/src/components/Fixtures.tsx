import { Text } from '../../../src/components/text/Text'
import { Code } from '../../../src/components/code/Code'
import { renderToStaticMarkup } from 'react-dom/server'
// Every variant of a built component, rendered from the same fixtures the
// visual test uses. What you see on the site is what gets compared with Figma.
// `display` is what the page shows when the tested element is an empty Figma frame.
type Fixture = { node: string; name: string; element: React.ReactNode; display?: React.ReactNode; force?: string[] }
// Components in src/components/<id>/, effects in src/effects/<id>.fixtures.tsx.
const modules = import.meta.glob(['../../../src/components/*/*.fixtures.tsx', '../../../src/effects/*.fixtures.tsx'], { eager: true }) as Record<string, { fixtures: Fixture[]; usage?: string; preview?: React.ReactNode }>

// One caption format everywhere a variant is named: each value as a word
// with a capital, joined by " · ". `state=Default, selected=True` reads
// "Default · Selected", False reads "Not selected", and a lone fixture named
// after its component (`divider`) reads "Default".
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const caption = (name: string, id?: string) =>
  name === id ? 'Default'
    : name.split(/,\s*/).map((part) => {
      const [axis, value] = part.includes('=') ? part.split('=') : [null, part]
      if (value === 'True') return cap(axis!)
      if (value === 'False') return `Not ${axis!.toLowerCase()}`
      return cap(value.trim())
    }).join(' · ')

export const fixturesFor = (id: string) => Object.entries(modules).find(([p]) => p.includes(`/components/${id}/`) || p.endsWith(`/effects/${id}.fixtures.tsx`))?.[1]

export function Fixtures({ id }: { id: string }) {
  const mod = fixturesFor(id)
  if (!mod) return null
  // An effect has no variants: it's one token, shown applied.
  if (!mod.fixtures.length) return <div className="fixtures"><figure className="fixture"><div className="fixture-stage">{mod.preview}</div></figure></div>
  // Hover, pressed and focus are the browser's. The test forces them; a page
  // can't, so those are left for you to try on the real thing.
  const still = mod.fixtures.filter((f) => !f.force?.length)
  const live = mod.fixtures.length - still.length
  return (
    <>
      <div className="fixtures">
        {still.map((f) => (
          <figure key={f.node} className="fixture">
            <div className="fixture-stage">{f.display ?? f.element}</div>
            <Text variant="label" as="figcaption" tone="tertiary"><Code>{caption(f.name, id)}</Code></Text>
          </figure>
        ))}
      </div>
      {live > 0 && <Text variant="paragraph" tone="tertiary" className="fixture-note">Hover, press or tab to one to see the other {live} states.</Text>}
    </>
  )
}

/** A built component's card preview, or nothing. */
export function Preview({ id }: { id: string }) {
  return <>{fixturesFor(id)?.preview ?? null}</>
}

/**
 * A preview for inside a card, which is a link. A link inside a link isn't
 * HTML: the browser splits the card apart (Breadcrumb's did, on the home
 * page). So its links become spans with the same classes: they look the same
 * and can't be pressed, which is right in a glimpse.
 */
export const cardPreview = (id: string) => {
  const p = fixturesFor(id)?.preview
  return p == null ? null : renderToStaticMarkup(<>{p}</>).replace(/<a\b/g, '<span').replace(/<\/a>/g, '</span>')
}

/** One fixture by name, drawn on its own: what a guidance card shows. */
export function Shot({ id, name }: { id: string; name: string }) {
  const f = fixturesFor(id)?.fixtures.find((x) => x.name === name)
  if (!f) throw new Error(`${id}: guidance shows "${name}", and there's no fixture by that name`)
  return <>{f.display ?? f.element}</>
}
