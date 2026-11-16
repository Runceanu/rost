// Every component page as markdown: /components/button.md.
import type { APIRoute } from 'astro'
import { componentDocIds, componentMarkdown, markdown } from '../../lib/markdown'

export function getStaticPaths() {
  return componentDocIds.map((id) => ({ params: { id } }))
}

export const GET: APIRoute = ({ params }) => markdown(componentMarkdown(params.id!))
