// Every item in the registry, without the files' contents.
import type { APIRoute } from 'astro'
import { registryIndex, json } from '../../lib/registry'

export const GET: APIRoute = () => json(registryIndex())
