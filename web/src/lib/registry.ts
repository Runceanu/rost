// The registry at /r/, read from bin/lib/registry.mjs, the same builder the CLI uses.
import { pathToFileURL } from 'node:url'

declare const __REPO__: string
const lib = await import(/* @vite-ignore */ new URL('bin/lib/registry.mjs', pathToFileURL(__REPO__)).href)

export const registryIds: string[] = lib.builtIds(__REPO__)
export const baseItem = () => lib.baseItem(__REPO__)
export const componentItem = (id: string) => lib.componentItem(__REPO__, id)
export const registryIndex = () => lib.registryIndex(__REPO__)
export const json = (data: unknown) => new Response(JSON.stringify(data, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
