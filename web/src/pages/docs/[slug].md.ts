// Every doc as markdown: /docs/install.md.
import type { APIRoute } from 'astro'
import { DOCS } from '../../lib/docs'
import { docMarkdown, markdown } from '../../lib/markdown'

export function getStaticPaths() {
  return Object.keys(DOCS).map((slug) => ({ params: { slug } }))
}

export const GET: APIRoute = ({ params }) => markdown(docMarkdown(params.slug as keyof typeof DOCS))
