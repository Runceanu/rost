/**
 * Reading and writing YAML contracts.
 *
 * Writing is deterministic: same contract in, same bytes out, so a re-read of
 * Figma that changes nothing leaves an empty diff, and a diff that is not empty
 * is a real change to review.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import YAML from 'yaml'

export const CONTRACTS = new URL('../../contracts/', import.meta.url)
export const SCHEMA_VERSION = 2

/** Top-level key order: identity, then API, then the values, then the prose. */
const ORDER = ['schemaVersion', 'id', 'name', 'kind', 'status', 'summary', 'category', 'related', 'source',
  'props', 'states', 'elements', 'variants', 'guidance', 'implementations', 'deviations', 'pending']

const ordered = (c) => Object.fromEntries([
  ...ORDER.filter((k) => c[k] !== undefined).map((k) => [k, c[k]]),
  ...Object.entries(c).filter(([k]) => !ORDER.includes(k)),
])

/** A value is a leaf `{ token, value }`. Print it on one line, like a table cell. */
const isValue = (node) =>
  YAML.isMap(node) && node.items.some((p) => p.key?.value === 'value') &&
  node.items.every((p) => ['token', 'value', 'assert', 'suggest'].includes(p.key?.value))

export function stringify(contract) {
  const doc = new YAML.Document(ordered(contract))
  YAML.visit(doc, {
    // `168:1149` is a string in YAML 1.2 but a base-60 integer to a YAML 1.1
    // reader, and dates become timestamps. Quote anything that could be misread.
    Scalar(_, node) {
      if (typeof node.value !== 'string') return
      if (/^[\d:.\-]+$/.test(node.value)) node.type = 'QUOTE_DOUBLE'
      // Prose that would need escaping reads better as a literal block.
      else if (node.value.length > 60 && /["`]|: /.test(node.value)) node.type = 'BLOCK_LITERAL'
    },
    Map(_, node) { if (isValue(node)) node.flow = true },
    Seq(_, node) {
      // Short scalar lists (related, values, states) read better inline.
      if (node.items.every((i) => YAML.isScalar(i) && String(i.value).length < 24)) node.flow = true
    },
    Pair(_, pair) {
      // Variant conditions are a small map; inline them too.
      if (pair.key?.value === 'when' && YAML.isMap(pair.value)) pair.value.flow = true
    },
  })
  return '# yaml-language-server: $schema=../schema/component-contract.schema.json\n' +
    doc.toString({ lineWidth: 0, flowCollectionPadding: true, singleQuote: false })
}

export const read = (id) => YAML.parse(readFileSync(new URL(`${id}.contract.yaml`, CONTRACTS), 'utf8'))
export const write = (contract) => writeFileSync(new URL(`${contract.id}.contract.yaml`, CONTRACTS), stringify(contract))
export const ids = () => readdirSync(CONTRACTS).filter((f) => f.endsWith('.contract.yaml')).map((f) => f.replace('.contract.yaml', '')).sort()
