// Figma's own screenshots, for components that aren't in code yet. Only those
// pages show them, so only those get them: each picture is read from disk and
// written into its page, instead of bundling every screenshot into the site.
// Icons and illustrations have their own page.
import { readFileSync, existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { blankShot } from './kit'

declare const __REPO__: string
const repo = pathToFileURL(__REPO__)
const PRIVATE = new Set(['icons', 'illustrations'])
const manifest = JSON.parse(readFileSync(new URL('baseline/manifest.json', repo), 'utf8')) as Record<string, { nodeId: string; name: string; file: string; width: number; height: number }[]>

export interface Shot { nodeId: string; name: string; file: string; width: number; height: number; url: string }

/** Every screenshot of a component that's public and not empty, as a data URL. */
export function shotsFor(id: string): { shots: Shot[]; blanks: number } {
  if (PRIVATE.has(id)) return { shots: [], blanks: 0 }
  const present = (manifest[id] ?? []).filter((v) => existsSync(new URL(`baseline/${id}/${v.file}`, repo)))
  const shots = present
    .filter((v) => !blankShot(`baseline/${id}/${v.file}`))
    .map((v) => ({ ...v, url: `data:image/png;base64,${readFileSync(new URL(`baseline/${id}/${v.file}`, repo)).toString('base64')}` }))
  return { shots, blanks: present.length - shots.length }
}
