/**
 * Checks an implementation against its contract.
 *
 * A contract nobody enforces is a third copy of the truth (next to Figma and
 * the CSS), and the one that drifts fastest, because nothing breaks when it
 * goes stale. So the contract is only half of this; the half that pays is the
 * check that fails the build.
 *
 * It works on the stylesheets themselves, for two reasons: it needs no
 * browser or screenshot, and it can compare token names, not just pixels. Two
 * tokens that hold the same hex today come apart the moment one is retuned,
 * and a pixel diff can't see that coming.
 *
 *   const contract = forApp(YAML.parse(yaml), 'accounting-app')
 *   conform(contract, css, tokensCss)                       // the fixed values
 *   conform(contract, css, tokensCss, 'status=Negative')    // one variant
 */

export interface ContractValue {
  readonly token?: string
  readonly value: string
  readonly notes?: string
  /** false when the value is written down but isn't a spec to check. */
  readonly assert?: boolean
}
export type PartValues = Readonly<Record<string, Readonly<Record<string, ContractValue>>>>

/** One app's view of a contract: its selectors, the fixed values, and the variants keyed as Figma names them. */
export interface Contract {
  readonly name: string
  readonly implementation?: {
    readonly rootSelector?: string
    readonly partSelectors?: Readonly<Record<string, string>>
  }
  readonly invariants: PartValues
  readonly variants?: Readonly<Record<string, PartValues>>
  readonly deviations?: readonly { what: string; why: string }[]
  /** How Rost's own CSS reaches a state (see the schema): only used when checking Rost's CSS. */
  readonly statesOn?: string
  readonly stateSelectors?: Readonly<Record<string, string>>
}

/** A contract as written in contracts/*.contract.yaml (schema v2). */
export interface YamlContract {
  readonly id: string
  readonly name: string
  readonly props?: Readonly<Record<string, { readonly type: string }>>
  readonly elements: Readonly<Record<string, { readonly styles?: Readonly<Record<string, ContractValue>> }>>
  readonly variants?: readonly {
    readonly when: Readonly<Record<string, string | boolean>>
    readonly elements?: PartValues
  }[]
  readonly implementations?: Readonly<Record<string, {
    readonly root?: string
    readonly parts?: Readonly<Record<string, string>>
    readonly deviations?: readonly { what: string; why: string }[]
  }>>
  readonly deviations?: readonly { what: string; why: string }[]
  readonly statesOn?: string
  readonly stateSelectors?: Readonly<Record<string, string>>
}

export interface Finding {
  readonly part: string
  readonly property: string
  readonly expected: string
  readonly actual: string | null
  readonly kind: 'missing' | 'value' | 'token'
}

export interface ConformOptions {
  /**
   * How the app names its modifier classes. `rost` is what bin/build-css.mjs
   * writes (`--status-negative`, `--selected`); `value` is the shorter form
   * some apps use (`--negative`). Default: rost.
   */
  readonly modifiers?: 'rost' | 'value'
}

/** `{ state: Hover, selected: true }` -> `state=Hover, selected=True`, Figma's own key. Mirrors bin/lib/kit.mjs. */
export const variantKey = (when: Readonly<Record<string, string | boolean>>): string =>
  Object.entries(when).map(([k, v]) => `${k}=${v === true ? 'True' : v === false ? 'False' : v}`).join(', ')

type When = Readonly<Record<string, string | boolean>>

/**
 * The variants with their layers applied, keyed as Figma names them. An entry
 * whose `when` sits inside another entry's is a layer, not a variant: its
 * values go into every variant it sits inside, the least specific first and,
 * between two as specific, the later one last. Mirrors variantsOf in bin/lib/kit.mjs.
 */
export function variantsOf(c: YamlContract): Record<string, PartValues> {
  const all = c.variants ?? []
  const within = (a: When, b: When) => Object.entries(a).every(([k, v]) => b[k] === v)
  const size = (w: When) => Object.keys(w).length
  const out: Record<string, PartValues> = {}
  for (const v of all) {
    if (all.some((y) => size(y.when) > size(v.when) && within(v.when, y.when))) continue
    const on = all.map((x, i) => [x, i] as const).filter(([x]) => within(x.when, v.when))
      .sort(([a, i], [b, j]) => size(a.when) - size(b.when) || i - j)
    const elements: Record<string, Readonly<Record<string, ContractValue>>> = {}
    for (const [x] of on) for (const [p, s] of Object.entries(x.elements ?? {})) elements[p] = { ...elements[p], ...s }
    if (Object.keys(elements).length) out[variantKey(v.when)] = elements
  }
  return out
}

export function forApp(c: YamlContract, app: string): Contract {
  const impl = c.implementations?.[app]
  const invariants: Record<string, Readonly<Record<string, ContractValue>>> = {}
  for (const [part, e] of Object.entries(c.elements)) if (e.styles) invariants[part] = e.styles
  const variants = variantsOf(c)
  return {
    name: c.name,
    ...(impl ? { implementation: { rootSelector: impl.root, partSelectors: impl.parts } } : {}),
    invariants,
    variants,
    deviations: [...(c.deviations ?? []), ...(impl?.deviations ?? [])],
    ...(c.statesOn ? { statesOn: c.statesOn } : {}),
    ...(c.stateSelectors ? { stateSelectors: c.stateSelectors } : {}),
  }
}

/** `--name: value` pairs, for resolving var() chains. */
export function readTokens(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1]!, m[2]!.trim())
  return out
}

/** Splits on commas that aren't inside parentheses, so `:is(:disabled, [x])` stays whole. */
const splitTop = (s: string) => {
  const out: string[] = []
  let depth = 0, from = 0
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++
    else if (s[i] === ')') depth--
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(from, i)); from = i + 1 }
  }
  return [...out, s.slice(from)].map((x) => x.trim()).filter(Boolean)
}

/**
 * One spelling per selector. `.a:hover.a--on` and `.a--on:hover` match the
 * same element, so each compound's parts are sorted; the descendant order
 * stays. Without this, the check reports a rule as missing because it's
 * written in a different order.
 */
export function normSelector(sel: string): string {
  return splitDescendants(sel.trim()).map((compound) => {
    const parts = compound.match(/(\.[\w-]+|#[\w-]+|\[[^\]]*\]|::?[\w-]+(?:\((?:[^()]|\([^()]*\))*\))?|^[a-z*][\w-]*)/g) ?? [compound]
    const type = /^[a-z*]/.test(parts[0]!) ? parts.shift()! : ''
    return type + parts.sort().join('')
  }).join(' ')
}

/** Splits on spaces outside parentheses, so `:is(a, b) .x` is two compounds. */
function splitDescendants(sel: string): string[] {
  const out: string[] = []
  let depth = 0, from = 0
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] === '(') depth++
    else if (sel[i] === ')') depth--
    else if (/\s/.test(sel[i]!) && depth === 0) { if (i > from) out.push(sel.slice(from, i)); from = i + 1 }
  }
  if (from < sel.length) out.push(sel.slice(from))
  return out.filter(Boolean)
}

/**
 * Declarations per selector, later rules winning, as the cascade would.
 * Only top-level rules count: what's inside @media, @supports, @font-face or
 * @keyframes applies sometimes, or not to elements, so it isn't the base.
 */
export function readRules(css: string): Map<string, Map<string, string>> {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = new Map<string, Map<string, string>>()
  let i = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open < 0) break
    const prelude = src.slice(i, open).trim()
    // Find the matching close, wherever the nesting goes.
    let depth = 1, j = open + 1
    for (; j < src.length && depth; j++) { if (src[j] === '{') depth++; else if (src[j] === '}') depth-- }
    const body = src.slice(open + 1, j - 1)
    i = j
    if (!prelude || prelude.startsWith('@')) continue
    for (const raw of splitTop(prelude)) {
      // `:not(:disabled)` guards a state, it isn't part of the selector's
      // identity: `.btn--primary:hover:not(:disabled)` counts as `.btn--primary:hover`.
      const selector = normSelector(raw.replace(/:not\(:disabled\)/g, '').replace(/\s+/g, ' '))
      const decls = out.get(selector) ?? new Map<string, string>()
      for (const d of body.matchAll(/([\w-]+)\s*:\s*([^;]+)(?:;|$)/g)) decls.set(d[1]!.trim(), d[2]!.trim())
      out.set(selector, decls)
    }
  }
  return out
}

/** Follows var() to a literal, so a contract can state the value a reader sees. The fallback may hold parentheses: `var(--x, rgba(0,0,0,.5))`. */
export function resolve(value: string, tokens: Map<string, string>, depth = 0): string {
  if (depth > 10) return value
  const m = value.match(/var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))+))?\)/)
  if (!m) return value.trim()
  const replacement = tokens.get(m[1]!) ?? m[2] ?? ''
  return resolve(value.replace(m[0], replacement.trim()), tokens, depth + 1)
}

/**
 * Figma writes #999 where CSS writes #999999. Same colour, and a difference
 * here would be reported as drift nobody can act on, which is how a checker
 * teaches people to ignore it.
 */
const norm = (v: string) =>
  v.trim().toLowerCase().replace(/\s+/g, ' ').replace(/^0px$/, '0').replace(/;$/, '')
    .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3')

/** The token a declaration actually used, in the contract's slash form. */
function tokenPathOf(raw: string): string | null {
  const m = raw.match(/var\(\s*--([\w-]+)/)
  return m ? m[1]!.replace(/-/g, '/') : null
}

/**
 * Contract paths have slashes and CSS variables don't, so the mapping is
 * lossy: `spacing/gap/3xsmall` and a made-up `spacing/gap-3xsmall` flatten to
 * the same variable. Comparing the flat form is honest about that.
 */
const flatten = (path: string) => path.replace(/[/-]/g, '')

// Each interaction state and the pseudo-classes an app may use for it. Mirrors
// STATE_PSEUDO in bin/lib/kit.mjs, with the plain forms apps write by hand.
const STATE_PSEUDOS: Record<string, string[]> = {
  default: [''],
  hover: [':hover'],
  pressed: [':active'],
  focus: [':focus-visible', ':focus'],
  disabled: [':is(:disabled, [aria-disabled="true"])', ':disabled', '[aria-disabled="true"]'],
}

// Not CSS: which sides get a stroke. The border's own style and width carry it.
const NOT_CSS = new Set(['border-sides'])

export function conform(contract: Contract, css: string, tokensCss: string, variant?: string, options: ConformOptions = {}): Finding[] {
  const tokens = readTokens(tokensCss)
  const rules = readRules(css)
  const root = contract.implementation?.rootSelector
  if (!root) return [{ part: 'root', property: 'implementation', expected: 'a root selector for this app', actual: null, kind: 'missing' }]
  const valueStyle = options.modifiers === 'value'

  /**
   * A variant key is Figma's, e.g. `type=Secondary, state=Hover`. Code splits
   * it across two mechanisms: props become modifier classes, the state a
   * pseudo-class. Modifiers go first and the pseudo-class last, whatever the
   * order in the key, or the selector could never match.
   */
  const variantSelectors = (): string[] => {
    if (!variant) return [root]
    // The same as bin/build-css.mjs, so a camelCase prop (iconOnly) names the same class (--icon-only).
    const kebab = (s: string) => s.trim().replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
    let modifiers = ''
    let pseudos = ['']
    for (const pair of variant.split(',')) {
      const [axisRaw, valueRaw] = pair.split('=')
      if (!axisRaw?.trim() || !valueRaw?.trim()) continue
      const axis = kebab(axisRaw)
      const value = kebab(valueRaw)
      // Rost's own CSS can put a state on a part inside (`stateSelectors`), or
      // only on a link or a button (`statesOn`); other apps write it plainly.
      const own = valueStyle ? undefined : contract.stateSelectors?.[valueRaw.trim()]
      if (axis === 'state' && own) pseudos = [own]
      else if (axis === 'state' && STATE_PSEUDOS[value]) pseudos = STATE_PSEUDOS[value]!.map((p) =>
        !valueStyle && contract.statesOn && ['hover', 'pressed', 'focus'].includes(value) ? `${p}${contract.statesOn}` : p)
      // Locked and the like aren't pseudo-classes: they're modifiers the caller sets.
      else if (value === 'true') modifiers += `${root}--${axis}`
      else if (value === 'false') modifiers += valueStyle ? '' : `:not(${root}--${axis})`
      else modifiers += valueStyle ? `${root}--${value}` : `${root}--${axis}-${value}`
    }
    return pseudos.map((p) => `${root}${modifiers}${p}`)
  }

  const partSelector = (part: string) => contract.implementation?.partSelectors?.[part] ?? `${root}__${part}`
  const mapped = (part: string) => part === 'root' || contract.implementation?.partSelectors?.[part] !== undefined

  /**
   * The declarations a part ends up with: its base rule, then the variant's
   * rule on top, the way the cascade layers them. A part's variant rule is
   * written under the root's variant selector (`.x--secondary .x__label`).
   */
  const declarationsFor = (part: string): Map<string, string> => {
    const merged = new Map<string, string>()
    const base = part === 'root' ? root : partSelector(part)
    const variantRules = variant
      ? variantSelectors().map((v) => (part === 'root' ? v : `${v} ${partSelector(part)}`))
      : []
    for (const sel of [base, ...variantRules]) for (const [k, v] of rules.get(normSelector(sel)) ?? []) merged.set(k, v)
    return merged
  }

  const expand = (prop: string, decls: Map<string, string>): string | undefined => {
    const direct = decls.get(prop)
    if (direct !== undefined) return direct
    // Shorthands the contract may address longhand.
    if (prop.startsWith('padding-')) {
      const short = decls.get('padding')
      if (short === undefined) return undefined
      const [top, right = top, bottom = top, left = right] = short.split(/\s+(?![^(]*\))/) as [string, ...string[]]
      return { 'padding-top': top, 'padding-right': right, 'padding-bottom': bottom, 'padding-left': left }[prop]
    }
    if (prop === 'border-width' || prop === 'border-color') {
      // A stroke on some sides only (Figma's `border-l border-t`) is written per side.
      for (const side of ['top', 'right', 'bottom', 'left']) {
        const one = decls.get(`border-${side}-${prop.split('-')[1]}`)
        if (one !== undefined) return one
      }
      const short = decls.get('border')
      if (short === undefined) return undefined
      const bits = short.split(/\s+(?![^(]*\))/)
      return prop === 'border-width' ? bits[0] : bits.slice(2).join(' ')
    }
    if (prop === 'background') return decls.get('background-color')
    // The family is set once, globally, and inherited. Declaring it on every
    // label would be the drift; reading it from the document is the check.
    if (prop === 'font-family') {
      for (const sel of ['body', 'html', ':root']) {
        const inherited = rules.get(sel)?.get('font-family')
        if (inherited !== undefined) return inherited
      }
    }
    return undefined
  }

  const findings: Finding[] = []
  // What each part should end up with: the fixed values, with the variant's
  // own values on top. Checking the fixed ones alone against a variant would
  // report every override as drift.
  const expected: Record<string, Record<string, ContractValue>> = {}
  for (const [part, props] of Object.entries(contract.invariants)) expected[part] = { ...props }
  if (variant && contract.variants?.[variant])
    for (const [part, props] of Object.entries(contract.variants[variant]!)) expected[part] = { ...expected[part], ...props }

  for (const section of [expected]) {
    for (const [part, props] of Object.entries(section)) {
      // Only parts the app claims are checked: a Figma node with no
      // counterpart in code (a default glyph inside a caller's slot) isn't
      // this codebase's business.
      if (!mapped(part)) continue
      const decls = declarationsFor(part)
      for (const [property, expected] of Object.entries(props)) {
        if (expected.assert === false || NOT_CSS.has(property)) continue
        const raw = expand(property, decls)
        if (raw === undefined) {
          findings.push({ part, property, expected: expected.value, actual: null, kind: 'missing' })
          continue
        }
        let actual = resolve(raw, tokens)
        // Figma names one family; CSS adds fallbacks after it. The first is the decision.
        if (property === 'font-family') actual = actual.split(',')[0]!.trim()
        // A composite value (a gradient) can name a token inside it; compare what both resolve to.
        if (norm(actual) !== norm(resolve(expected.value, tokens))) {
          findings.push({ part, property, expected: expected.value, actual, kind: 'value' })
          continue
        }
        // Right pixels, wrong token: invisible today, wrong the moment it's retuned.
        if (expected.token) {
          const used = tokenPathOf(raw)
          if (used !== null && flatten(used) !== flatten(expected.token)) findings.push({ part, property, expected: expected.token, actual: used, kind: 'token' })
        }
      }
    }
  }
  return findings
}
