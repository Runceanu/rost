/**
 * Rost as a registry: one JSON item per built component, in shadcn's
 * registry-item format, so `npx shadcn add https://rost.build/r/button.json`
 * works, and so does Rost's own `npx rost add button` (bin/rost.mjs).
 *
 * Every file is a plain file with a target, so it lands where `bin/add.mjs`
 * puts it: `src/rost/<id>/` and `contracts/rost/<id>.contract.yaml`. Nothing
 * is rewritten on the way. The components import each other with relative
 * paths (`../badge/Badge`), and those keep working because they all sit side
 * by side in `src/rost/`.
 *
 * The site serves these from /r/ (web/src/pages/r/). The repo root is passed
 * in, because Astro bundles this file somewhere else.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import YAML from 'yaml'

export const SITE = 'https://rost.build'
const SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'

const filesIn = (dir) => readdirSync(dir, { recursive: true })
  .filter((f) => statSync(join(dir, f)).isFile() && !f.endsWith('.fixtures.tsx'))
  .sort()

/** The components that are in code, by folder name. */
export function builtIds(repo) {
  const dir = join(repo, 'src/components')
  return readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory()).sort()
}

/** The other components a component imports (`from '../badge/Badge'`). */
export function needsOf(repo, id) {
  const dir = join(repo, 'src/components', id)
  return [...new Set(filesIn(dir).filter((f) => f.endsWith('.tsx'))
    .flatMap((f) => [...readFileSync(join(dir, f), 'utf8').matchAll(/from '\.\.\/([\w-]+)\//g)].map((m) => m[1])))]
    .filter((d) => d !== id).sort()
}

const file = (path, target, content) => ({ path, type: 'registry:file', target: `~/${target}`, content })

/** The item every component needs: the tokens, the font, the conformance check. */
export function baseItem(repo) {
  return {
    $schema: SCHEMA,
    name: 'rost',
    type: 'registry:lib',
    title: 'Rost',
    description: "Rost's tokens (dark and light), its font, and conform.ts, the check that keeps a copied component true to its contract. Import src/rost/fonts.css and src/rost/tokens.css once, at the root of the app.",
    docs: `${SITE}/tokens/`,
    files: [
      file('rost/tokens.css', 'src/rost/tokens.css', readFileSync(join(repo, 'tokens/tokens.css'), 'utf8')),
      file('rost/fonts.css', 'src/rost/fonts.css', readFileSync(join(repo, 'tokens/fonts.css'), 'utf8')),
      file('rost/conform.ts', 'src/rost/conform.ts', readFileSync(join(repo, 'src/conform.ts'), 'utf8')),
      file('rost/assets.d.ts', 'src/rost/assets.d.ts', readFileSync(join(repo, 'src/assets.d.ts'), 'utf8')),
    ],
  }
}

/** One component as a registry item. `base` is where the other items are served. */
export function componentItem(repo, id, base = `${SITE}/r`) {
  const dir = join(repo, 'src/components', id)
  const contractPath = join(repo, 'contracts', `${id}.contract.yaml`)
  const contract = existsSync(contractPath) ? readFileSync(contractPath, 'utf8') : null
  const c = contract ? YAML.parse(contract) : {}
  const summary = String(c.summary ?? '').trim().replace(/\s+/g, ' ')
  return {
    $schema: SCHEMA,
    name: id,
    type: 'registry:ui',
    title: c.name ?? id,
    description: summary,
    docs: `${SITE}/components/${c.partOf ?? id}/`,
    registryDependencies: [`${base}/rost.json`, ...needsOf(repo, id).map((n) => `${base}/${n}.json`)],
    files: [
      ...filesIn(dir).map((f) => file(`rost/${id}/${f}`, `src/rost/${id}/${f}`, readFileSync(join(dir, f), 'utf8'))),
      ...(contract ? [file(`contracts/${id}.contract.yaml`, `contracts/rost/${id}.contract.yaml`, contract)] : []),
    ],
  }
}

/** The index at /r/registry.json: every item, without its files. */
export function registryIndex(repo, base = `${SITE}/r`) {
  const strip = ({ $schema, files, ...rest }) => ({ ...rest, files: files.map(({ content, ...f }) => f) })
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'rost',
    homepage: SITE,
    items: [strip(baseItem(repo)), ...builtIds(repo).map((id) => strip(componentItem(repo, id, base)))],
  }
}
