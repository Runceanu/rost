// Every variant of a built component, rendered from the same fixtures the
// visual test uses. What you see on the site is what gets compared with Figma.
const modules = import.meta.glob('../../../src/components/*/*.fixtures.tsx', { eager: true }) as Record<string, { fixtures: { node: string; name: string; element: React.ReactNode }[]; usage?: string }>

export const fixturesFor = (id: string) => Object.entries(modules).find(([p]) => p.includes(`/components/${id}/`))?.[1]

export function Fixtures({ id }: { id: string }) {
  const mod = fixturesFor(id)
  if (!mod) return null
  return (
    <div className="fixtures">
      {mod.fixtures.map((f) => (
        <figure key={f.node} className="fixture">
          <div className="fixture-stage">{f.element}</div>
          <figcaption>{f.name.replace(/[a-z]+=/gi, '').replace(/, /g, ' · ')}</figcaption>
        </figure>
      ))}
    </div>
  )
}
