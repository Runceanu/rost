#!/usr/bin/env node
/**
 * Talking to Figma's Dev Mode MCP server over HTTP directly.
 *
 * The in-session MCP client can drop its connection and then keep answering
 * "enable the Dev Mode MCP Server" even while Figma is listening perfectly well
 * on 127.0.0.1:3845. This bypasses that: it does the handshake itself, so the
 * only thing that matters is whether the server is actually up.
 *
 *   figma.mjs <tool> <nodeId> [--json]
 *   figma.mjs get_variable_defs 139:284
 */
const ENDPOINT = 'http://127.0.0.1:3845/mcp'

async function rpc(body, sessionId) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' }
  if (sessionId) headers['mcp-session-id'] = sessionId
  const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) })
  const sid = res.headers.get('mcp-session-id') ?? sessionId
  const text = await res.text()
  // Server speaks SSE even for single replies; take the last data: frame.
  const frames = [...text.matchAll(/^data: (.+)$/gm)].map((m) => JSON.parse(m[1]))
  return { sid, msg: frames.at(-1), raw: text }
}

export async function call(tool, args) {
  const init = await rpc({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'rost', version: '1.0' } },
  })
  const sid = init.sid
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, sid)
  const out = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } }, sid)
  if (out.msg?.error) throw new Error(JSON.stringify(out.msg.error))
  return (out.msg?.result?.content ?? []).map((c) => c.text ?? '').join('\n')
}

export async function listTools() {
  const init = await rpc({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'rost', version: '1.0' } },
  })
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid)
  const out = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, init.sid)
  return out.msg?.result?.tools ?? []
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [tool, nodeId] = process.argv.slice(2)
  if (tool === 'tools') {
    console.log((await listTools()).map((t) => `${t.name}  ${(t.description ?? '').slice(0, 90)}`).join('\n'))
  } else {
    console.log(await call(tool, { nodeId, clientFrameworks: 'react', clientLanguages: 'typescript,css' }))
  }
}

/** Like `call`, but keeps every content item, images included (`get_screenshot`). */
export async function callContent(tool, args) {
  const init = await rpc({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'rost', version: '1.0' } },
  })
  await rpc({ jsonrpc: '2.0', method: 'notifications/initialized' }, init.sid)
  const out = await rpc({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: tool, arguments: args } }, init.sid)
  if (out.msg?.error) throw new Error(JSON.stringify(out.msg.error))
  return out.msg?.result?.content ?? []
}
