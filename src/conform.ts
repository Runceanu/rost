/**
 * Checking an implementation against its contract.
 *
 * A contract nobody enforces is a THIRD copy of the truth — Figma, the CSS and
 * the JSON — and the one that drifts fastest, because nothing breaks when it
 * goes stale. So the JSON is only half of this; the half that pays is the
 * check that fails the build.
 *
 * It works statically, on the stylesheets themselves, for two reasons: it needs
 * no browser or screenshot baseline, and it can compare TOKEN PATHS rather than
 * only computed pixels. Two different tokens holding the same hex today will
 * diverge the moment one is retuned, and a pixel diff cannot see that coming.
 */

export interface ContractValue {
  readonly token?: string
  readonly value: string
  readonly notes?: string
  /** false when the value is recorded for reference but is not a specification. */
  readonly assert?: boolean
}
export type PartValues = Readonly<Record<string, Readonly<Record<string, ContractValue>>>>

export interface Contract {
  readonly name: string
  readonly implementation?: {
    readonly rootSelector?: string
    readonly partSelectors?: Readonly<Record<string, string>>
  }
  readonly invariants: PartValues
  readonly variants?: Readonly<Record<string, PartValues>>
  readonly deviations?: readonly { what: string; why: string }[]
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
}

/** `{ state: Hover, selected: true }` -> `state=Hover, selected=True`, Figma's own key. */
export const variantKey = (when: Readonly<Record<string, string | boolean>>): string =>
  Object.entries(when).map(([k, v]) => `${k}=${v === true ? 'True' : v === false ? 'False' : v}`).join(', ')

/**
 * The checker works on one app's view of a contract: that app's selectors,
 * every invariant, and the variants keyed as Figma names them.
 */
export function forApp(c: YamlContract, app: string): Contract {
  const impl = c.implementations?.[app]
  const invariants: Record<string, Readonly<Record<string, ContractValue>>> = {}
  for (const [part, e] of Object.entries(c.elements)) if (e.styles) invariants[part] = e.styles
  const variants: Record<string, PartValues> = {}
  for (const v of c.variants ?? []) if (v.elements) variants[variantKey(v.when)] = v.elements
  return {
    name: c.name,
    ...(impl ? { implementation: { rootSelector: impl.root, partSelectors: impl.parts } } : {}),
    invariants,
    variants,
    deviations: [...(c.deviations ?? []), ...(impl?.deviations ?? [])],
  }
}

export interface Finding {
  readonly part: string
  readonly property: string
  readonly expected: string
  readonly actual: string | null
  readonly kind: 'missing' | 'value' | 'token'
}

/** `--name: value` pairs, for resolving var() chains. */
export function readTokens(css: string): Map<string, string> {
  const out = new Map<string, string>()
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out.set(m[1]!, m[2]!.trim())
  return out
}

/** Declarations per selector, later rules winning, as the cascade would. */
export function readRules(css: string): Map<string, Map<string, string>> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out = new Map<string, Map<string, string>>()
  for (const m of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const body = m[2]!
    for (const raw of m[1]!.split(',').map((s) => s.trim())) {
      /*
       * `:not(:disabled)` is a guard, not part of the component's identity, so
       * a rule written `.ak-btn--primary:hover:not(:disabled)` is indexed under
       * `.ak-btn--primary:hover`. Matching selector strings literally reported
       * every hover and pressed value as missing.
       */
      const selector = raw.replace(/:not\([^)]*\)/g, '')
      if (!selector || selector.startsWith('@')) continue
      const decls = out.get(selector) ?? new Map<string, string>()
      for (const d of body.matchAll(/([\w-]+)\s*:\s*([^;]+)(?:;|$)/g)) {
        decls.set(d[1]!.trim(), d[2]!.trim())
      }
      out.set(selector, decls)
    }
  }
  return out
}

/** Follows var() to a literal, so a contract can state the value a reader sees. */
export function resolve(value: string, tokens: Map<string, string>, depth = 0): string {
  if (depth > 10) return value
  const m = value.match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/)
  if (!m) return value.trim()
  const replacement = tokens.get(m[1]!) ?? m[2] ?? ''
  return resolve(value.replace(m[0], replacement.trim()), tokens, depth + 1)
}

/**
 * Figma writes #999 where CSS writes #999999. Same colour, and a difference
 * here would be reported as drift that no one can act on, which is how a
 * checker teaches people to ignore it.
 */
const norm = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^0px$/, '0')
    .replace(/;$/, '')
    .replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, '#$1$1$2$2$3$3')

/** The token path a declaration actually used, in the contract's slash form. */
function tokenPathOf(raw: string): string | null {
  const m = raw.match(/var\(\s*--([\w-]+)/)
  return m ? m[1]!.replace(/-/g, '/') : null
}

/**
 * Contract paths are slash-separated and CSS custom properties are flat, so the
 * mapping is lossy: `spacing/gap/3xsmall` and a hypothetical `spacing/gap-3xsmall`
 * both flatten to the same variable. Comparing on the flattened form keeps this
 * honest about what it can and cannot distinguish.
 */
const flatten = (path: string) => path.replace(/[/-]/g, '')

export function conform(
  contract: Contract,
  css: string,
  tokensCss: string,
  variant?: string,
): Finding[] {
  const tokens = readTokens(tokensCss)
  const rules = readRules(css)
  const root = contract.implementation?.rootSelector
  if (!root) return []

  /**
   * A variant key is Figma's, e.g. `type=Secondary, state=Hover`. Code splits
   * those across two mechanisms: the type becomes a modifier class, the state a
   * pseudo-class. Treating the whole key as one modifier made conformance read
   * the base rule and report differences that were not real.
   */
  const STATE_PSEUDO: Record<string, string> = {
    default: '', hover: ':hover', pressed: ':active', focus: ':focus-visible', disabled: ':disabled',
  }
  const variantSelector = (base: string): string => {
    if (!variant) return base
    let sel = base
    for (const pair of variant.split(',')) {
      const [axisRaw, valueRaw] = pair.split('=').map((x) => x?.trim())
      if (!axisRaw || !valueRaw) continue
      const axis = axisRaw.toLowerCase()
      const value = valueRaw.toLowerCase()
      if (axis === 'state') sel += STATE_PSEUDO[value] ?? ''
      // A boolean axis names itself: `selected=True` is `--selected`, not
      // `--true`, and `=False` is simply the base.
      else if (value === 'true') sel = `${sel}--${axis}`
      else if (value !== 'false') sel = `${sel}--${value}`
    }
    return sel
  }

  const selectorFor = (part: string): string => {
    if (part === 'root') return variantSelector(root)
    return contract.implementation?.partSelectors?.[part] ?? `${root}__${part}`
  }

  // A part inherits the root's declarations, as the cascade gives them.
  const declarationsFor = (part: string): Map<string, string> => {
    const merged = new Map<string, string>()
    // Longest-matching chain, so a variant rule layers over the base as the
    // cascade would rather than replacing it.
    const chain = part === 'root' && variant ? [root, selectorFor(part)] : [selectorFor(part)]
    for (const sel of chain) for (const [k, v] of rules.get(sel) ?? []) merged.set(k, v)
    return merged
  }

  const expand = (prop: string, decls: Map<string, string>): string | undefined => {
    const direct = decls.get(prop)
    if (direct !== undefined) return direct
    // Shorthands the contract may address longhand.
    if (prop.startsWith('padding-') || prop === 'gap') {
      const short = decls.get(prop.startsWith('padding') ? 'padding' : 'gap')
      if (short === undefined) return undefined
      const parts = short.split(/\s+(?![^(]*\))/)
      const [top, right = top, bottom = top, left = right] = parts as [string, ...string[]]
      if (prop === 'gap') return short
      return { 'padding-top': top, 'padding-right': right, 'padding-bottom': bottom, 'padding-left': left }[prop]
    }
    if (prop === 'border-width' || prop === 'border-color') {
      const short = decls.get('border')
      if (short === undefined) return undefined
      return prop === 'border-width' ? short.split(/\s+(?![^(]*\))/)[0] : short.split(/\s+(?![^(]*\))/).slice(2).join(' ')
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

  /*
   * Only parts the implementation claims are checked. A Figma component
   * carries nodes with no counterpart in code — the default glyph inside an
   * optional icon slot, for one — and asserting those would report a component
   * as broken for not hardcoding something it correctly leaves to a caller.
   * Anything unmapped is simply not this codebase's business.
   */
  const mapped = (part: string) =>
    part === 'root' || contract.implementation?.partSelectors?.[part] !== undefined

  const findings: Finding[] = []
  const sections: PartValues[] = [contract.invariants]
  if (variant && contract.variants?.[variant]) sections.push(contract.variants[variant]!)

  for (const section of sections) {
    for (const [part, props] of Object.entries(section)) {
      if (!mapped(part)) continue
      const decls = declarationsFor(part)
      for (const [property, expected] of Object.entries(props)) {
        if (expected.assert === false) continue
        const raw = expand(property, decls)
        if (raw === undefined) {
          findings.push({ part, property, expected: expected.value, actual: null, kind: 'missing' })
          continue
        }
        let actual = resolve(raw, tokens)
        // Figma names one family; CSS adds fallbacks after it. The first is the decision.
        if (property === 'font-family') actual = actual.split(',')[0]!.trim()
        if (norm(actual) !== norm(expected.value)) {
          findings.push({ part, property, expected: expected.value, actual, kind: 'value' })
          continue
        }
        // Right pixels, wrong token: invisible today, wrong the moment it is retuned.
        if (expected.token) {
          const used = tokenPathOf(raw)
          if (used !== null && flatten(used) !== flatten(expected.token)) {
            findings.push({ part, property, expected: expected.token, actual: used, kind: 'token' })
          }
        }
      }
    }
  }
  return findings
}
