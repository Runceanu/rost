// One registry item per built component, plus `rost` (tokens, font, conform.ts).
//   npx shadcn add https://rost.build/r/button.json
import type { APIRoute } from 'astro'
import { registryIds, baseItem, componentItem, json } from '../../lib/registry'

export function getStaticPaths() {
  return ['rost', ...registryIds].map((name) => ({ params: { name } }))
}

export const GET: APIRoute = ({ params }) => json(params.name === 'rost' ? baseItem() : componentItem(params.name!))
