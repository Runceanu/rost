// Every variant of a built component, rendered from the same fixtures the
// visual test uses. What you see on the site is what gets compared with Figma.
// `display` is what the page shows when the tested element is an empty Figma frame.
type Fixture = { node: string; name: string; element: React.ReactNode; display?: React.ReactNode; force?: string[] }
// Components in src/components/<id>/, effects in src/effects/<id>.fixtures.tsx.
const modules = import.meta.glob(['../../../src/components/*/*.fixtures.tsx', '../../../src/effects/*.fixtures.tsx'], { eager: true }) as Record<string, { fixtures: Fixture[]; usage?: string; preview?: React.ReactNode }>

// Figma's variant name, as words: `state=Default, selected=True` reads
// "Default · selected", and False reads "not selected".
const caption = (name: string) =>
  name.replace(/([a-z]+)=True/gi, '$1').replace(/([a-z]+)=False/gi, 'not $1').replace(/[a-z]+=/gi, '').replace(/, /g, ' · ')

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
            <figcaption>{caption(f.name)}</figcaption>
          </figure>
        ))}
      </div>
      {live > 0 && <p className="fixture-note">Hover, press or tab to one to see the other {live} states.</p>}
    </>
  )
}

/** A built component's card preview, or nothing. */
export function Preview({ id }: { id: string }) {
  return <>{fixturesFor(id)?.preview ?? null}</>
}
