// Turns a contract's variants into spec tables. For every property that
// changes, it finds the axes the value actually depends on (often just
// `state`), then groups properties that depend on the same axes, so each
// group is one table: a column per state, a row per property. A property
// that has one value but is only set in some variants isn't a change; it's
// listed under the variants it belongs to.

export interface Cell { value: string; token?: string; v: any }
export interface Row { key: string; prefix: string; cells: (Cell | null)[] }
export interface Table { heading: string; columns: string[]; rows: Row[] }
export interface Group { axes: string[]; column: string; tables: Table[] }
export interface Only { label: string; rows: { key: string; v: any }[] }

type Variant = { name: string; at: Record<string, string> }

const parse = (name: string): Record<string, string> =>
  Object.fromEntries(name.split(', ').map((p) => p.split('=') as [string, string]))

const same = (a: any, b: any) => a.value === b.value && (a.token ?? '') === (b.token ?? '')

// Token paths in one row share their start ("actions/primary/"), which then
// moves to the row's label so the cells only show what differs.
function split(tokens: (string | undefined)[]): { prefix: string; cut: number } {
  const ts = tokens.filter(Boolean).map((t) => t!.split('/'))
  if (ts.length < 2) return { prefix: '', cut: 0 }
  let n = 0
  while (ts.every((t) => t.length > n + 1 && t[n] === ts[0][n])) n++
  return { prefix: ts[0].slice(0, n).join('/'), cut: n }
}

// A value that's a whole expression (a box-shadow) usually differs in one
// variable. The cells keep that variable; the rest is written once.
function vars(cells: ({ value: any } | null)[]): { template: string; picks: (string | null)[] } | null {
  const vals = cells.map((c) => (c ? String(c.value) : null))
  const present = vals.filter(Boolean) as string[]
  if (present.length < 2 || !present.every((v) => v.includes('var('))) return null
  const parts = present.map((v) => v.split(/(var\(--[\w-]+\))/))
  if (!parts.every((p) => p.length === parts[0].length)) return null
  const differs = parts[0].map((_, i) => parts.some((p) => p[i] !== parts[0][i]))
  if (differs.filter(Boolean).length !== 1) return null
  const at = differs.indexOf(true)
  const template = parts[0].map((x, i) => (i === at ? '…' : x)).join('')
  let n = 0
  return { template, picks: vals.map((v) => (v ? parts[n++][at].replace(/^var\(--|\)$/g, '') : null)) }
}

/** "status=Negative" when the set is exactly one axis value (or one pair), the names otherwise. */
export function describe(names: string[], all: Variant[], axes: string[]): string {
  const set = new Set(names)
  if (set.size === all.length) return 'Every variant'
  const matches = (pick: Record<string, string>) => {
    const hit = all.filter((v) => Object.entries(pick).every(([a, x]) => v.at[a] === x)).map((v) => v.name)
    return hit.length === set.size && hit.every((n) => set.has(n))
  }
  for (const a of axes) for (const x of new Set(all.map((v) => v.at[a]).filter(Boolean))) if (matches({ [a]: x })) return `${a}=${x}`
  for (const a of axes) for (const b of axes) if (a < b)
    for (const x of new Set(all.map((v) => v.at[a]).filter(Boolean))) for (const y of new Set(all.map((v) => v.at[b]).filter(Boolean)))
      if (matches({ [a]: x, [b]: y })) return `${a}=${x}, ${b}=${y}`
  // Everything but one axis value: "all but type=Borderless".
  const rest = all.filter((v) => !set.has(v.name)).map((v) => v.name)
  const not = rest.length < all.length / 2 ? describe(rest, all, axes) : null
  if (not && !not.includes(' variants') && not !== 'Every variant') return `All but ${not}`
  return `In ${names.length} variants`
}

export function variantTables(variantMap: Record<string, any>) {
  const all: Variant[] = Object.keys(variantMap).map((name) => ({ name, at: parse(name) }))
  const axes = [...new Set(all.flatMap((v) => Object.keys(v.at)))]
  const valuesOf = (a: string) => [...new Set(all.map((v) => v.at[a]).filter(Boolean))]

  // Every part.prop, with the value each variant gives it.
  const byKey = new Map<string, Map<string, any>>()
  for (const v of all)
    for (const [part, props] of Object.entries(variantMap[v.name] ?? {}) as [string, any][])
      for (const [prop, val] of Object.entries(props)) {
        const k = `${part}.${prop}`
        if (!byKey.has(k)) byKey.set(k, new Map())
        byKey.get(k)!.set(v.name, val)
      }

  // The smallest set of axes that decides the value, among the variants that set it.
  const dependsOn = (vals: Map<string, any>): string[] => {
    const set = all.filter((v) => vals.has(v.name))
    const decides = (d: string[]) => {
      const seen = new Map<string, any>()
      for (const v of set) {
        const key = d.map((a) => v.at[a]).join('|')
        if (seen.has(key) && !same(seen.get(key), vals.get(v.name))) return false
        seen.set(key, vals.get(v.name))
      }
      return true
    }
    for (let size = 1; size <= axes.length; size++) {
      const pick = (from: string[], n: number): string[][] => n === 0 ? [[]] : from.flatMap((a, i) => pick(from.slice(i + 1), n - 1).map((r) => [a, ...r]))
      const hit = pick(axes, size).find(decides)
      if (hit) return hit
    }
    return axes
  }

  const groups = new Map<string, { axes: string[]; scope: string; keys: string[] }>()
  const only = new Map<string, { key: string; v: any }[]>()
  for (const [k, vals] of [...byKey].sort(([a], [b]) => a.localeCompare(b))) {
    const list = [...vals.values()]
    if (list.every((x) => same(x, list[0]))) {
      const label = describe([...vals.keys()], all, axes)
      if (!only.has(label)) only.set(label, [])
      only.get(label)!.push({ key: k, v: list[0] })
      continue
    }
    const d = dependsOn(vals)
    // Where it's set at all, when that isn't everywhere: Primary's own background.
    const scope = vals.size === all.length ? '' : describe([...vals.keys()], all, axes)
    // With two axes or more, each table already names its type, so the scope doesn't split them.
    const id = d.length > 1 ? d.join('+') : `${d[0]}|${scope}`
    if (!groups.has(id)) groups.set(id, { axes: d, scope, keys: [] })
    groups.get(id)!.keys.push(k)
  }

  const out: Group[] = [...groups.values()].sort((a, b) => a.axes.length - b.axes.length || b.keys.length - a.keys.length).map(({ axes: d, scope, keys }) => {
    // Columns are the states when the value follows them, else the axis with the most values.
    const column = d.includes('state') ? 'state' : [...d].sort((a, b) => valuesOf(b).length - valuesOf(a).length)[0]
    const present = new Set(all.filter((v) => keys.some((k) => byKey.get(k)!.has(v.name))).map((v) => v.at[column]))
    const columns = valuesOf(column).filter((x) => present.has(x))
    const rest = d.filter((a) => a !== column)
    // One table per combination of the other axes it depends on: per type, say.
    const inScope = all.filter((v) => keys.some((k) => byKey.get(k)!.has(v.name)))
    const combos = [...new Set(inScope.map((v) => rest.map((a) => `${a}=${v.at[a]}`).join(', ')))]
    const tables = combos.map((heading) => {
      const at = parse(heading || '')
      const rows = keys.map((key) => {
        const vals = byKey.get(key)!
        const cells = columns.map((c) => {
          const v = all.find((x) => x.at[column] === c && rest.every((a) => x.at[a] === at[a]) && vals.has(x.name))
          return v ? vals.get(v.name) : null
        })
        const expr = cells.some((c) => c?.token) ? null : vars(cells)
        if (expr) return { key, prefix: expr.template, cells: cells.map((v, i) => v && { v, value: '', token: expr.picks[i]! }) }
        const { prefix, cut } = split(cells.map((c) => c?.token))
        return { key, prefix: prefix && `${prefix}/…`, cells: cells.map((v) => v && { v, value: String(v.value), token: v.token?.split('/').slice(cut).join('/') }) }
      }).filter((r) => r.cells.some(Boolean))
      return { heading: heading || (d.length === 1 ? scope : ''), columns, rows }
    }).filter((t) => t.rows.length)
    return { axes: d, column, tables }
  })
  // One group per set of axes: Primary's background and Secondary's outline both follow state.
  const merged: Group[] = []
  for (const g of out) {
    const at = merged.find((m) => m.axes.join('+') === g.axes.join('+'))
    if (at) at.tables.push(...g.tables)
    else merged.push(g)
  }

  return { groups: merged, only: [...only].map(([label, rows]) => ({ label, rows })), count: all.length }
}
