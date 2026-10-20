// Figma's own screenshots, for components that aren't in code yet. Only a
// component's own folder, one level down. Two of those hold private things (a
// client's name, real people's photos) and never ship; icons and
// illustrations have their own page.
import { blankShot } from './kit'

const urls = import.meta.glob(['../../../baseline/*/*.png', '!../../../baseline/thumbs/*', '!../../../baseline/testimonials-pics/*', '!../../../baseline/icons/*', '!../../../baseline/illustrations/*'], { query: '?url', import: 'default', eager: true }) as Record<string, string>
const manifest = (await import('../../../baseline/manifest.json')).default as Record<string, { nodeId: string; name: string; file: string; width: number; height: number }[]>

export interface Shot { nodeId: string; name: string; file: string; width: number; height: number; url: string }

/** Every screenshot of a component that's public and not empty. */
export function shotsFor(id: string): { shots: Shot[]; blanks: number } {
  const withUrl = (manifest[id] ?? [])
    .map((v) => ({ ...v, url: Object.entries(urls).find(([p]) => p.endsWith(`/baseline/${id}/${v.file}`))?.[1] }))
    .filter((v): v is Shot => Boolean(v.url))
  const shots = withUrl.filter((v) => !blankShot(`baseline/${id}/${v.file}`))
  return { shots, blanks: withUrl.length - shots.length }
}
