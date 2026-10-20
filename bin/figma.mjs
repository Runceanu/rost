#!/usr/bin/env node
/**
 * Talks to Figma's Dev Mode MCP server over HTTP directly.
 *
 * The in-session MCP client can drop its connection and then keep answering
 * "enable the Dev Mode MCP Server" while Figma is listening fine on
 * 127.0.0.1:3845. This does the handshake itself, so the only thing that
 * matters is whether the server is up.
 *
 * The server only sees the file in Figma's front tab, and it has a daily limit.
 *
 *   node bin/figma.mjs <tool> <nodeId>
 *   node bin/figma.mjs tools
 */
import { pathToFileURL } from 'node:url'

const ENDPOINT = 'http://127.0.0.1:3845/mcp'

async function rpc(body, sessionId) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }
  if (sessionId) headers['mcp-session-id'] = sessionId
  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Figma server answered ${res.status}`)
  const sid = res.headers.get('mcp-session-id') ?? sessionId
  const text = await res.text()
  // The server speaks SSE even for single replies: take the last data: frame,
  // or the body itself when it's plain JSON.
  const frames = [...text.matchAll(/^data: (.+)$/gm)].map((m) => JSON.parse(m[1]))
  return { sid, msg: frames.length ? frames.at(-1) : text ? JSON.parse(text) : undefined }
}

async function session() {
  const init = await rpc({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'rost', version: '1.0' } } })
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid)
  return (method, params) => rpc({ jsonrpc: '2.0', id: 2, method, params }, init.sid)
}

// Figma also says "no" in plain text, as if it were the answer. These must
// never be saved as a read.
const REFUSALS = /^(No node could be found|Rate limit exceeded|Error getting|Make sure the Figma desktop app)/i

/** Every content item a tool returns, images included (`get_screenshot`). Throws on any kind of failure. */
export async function callContent(tool, args) {
  const out = await (await session())('tools/call', { name: tool, arguments: args })
  if (out.msg?.error) throw new Error(JSON.stringify(out.msg.error))
  const content = out.msg?.result?.content ?? []
  const text = content.map((c) => c.text ?? '').join('\n').trim()
  if (out.msg?.result?.isError || REFUSALS.test(text)) throw new Error(text.slice(0, 160) || 'Figma returned an error')
  if (!content.length) throw new Error('Figma returned nothing')
  return content
}

/** The text a tool returns. */
export const call = async (tool, args) => (await callContent(tool, args)).map((c) => c.text ?? '').join('\n')

export async function listTools() {
  return (await (await session())('tools/list')).msg?.result?.tools ?? []
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [tool, nodeId] = process.argv.slice(2)
  if (tool === 'tools') console.log((await listTools()).map((t) => `${t.name}  ${(t.description ?? '').slice(0, 90)}`).join('\n'))
  else console.log(await call(tool, { nodeId, clientFrameworks: 'react', clientLanguages: 'typescript,css' }))
}
