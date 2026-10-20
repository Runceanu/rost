// Every variant of a built component, rendered from the same fixtures the
// visual test uses. What you see on the site is what gets compared with Figma.
type Fixture = { node: string; name: string; element: React.ReactNode; force?: string[] }
const modules = import.meta.glob('../../../src/components/*/*.fixtures.tsx', { eager: true }) as Record<string, { fixtures: Fixture[]; usage?: string; preview?: React.ReactNode }>

export const fixturesFor = (id: string) => Object.entries(modules).find(([p]) => p.includes(`/components/${id}/`))?.[1]

export function Fixtures({ id }: { id: string }) {
  const mod = fixturesFor(id)
  if (!mod) return null
  // Hover, pressed and focus are the browser's. The test forces them; a page
  // can't, so those are left for you to try on the real thing.
  const still = mod.fixtures.filter((f) => !f.force?.length)
  const live = mod.fixtures.length - still.length
  return (
    <>
      <div className="fixtures">
        {still.map((f) => (
          <figure key={f.node} className="fixture">
            <div className="fixture-stage">{f.element}</div>
            <figcaption>{f.name.replace(/[a-z]+=/gi, '').replace(/, /g, ' · ')}</figcaption>
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
