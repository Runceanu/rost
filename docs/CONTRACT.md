# The component contract

Each component in this kit is **one YAML file**: `contracts/<id>.contract.yaml`. It states once, in one place:
- where the component was read from
- its props and states
- every part and the values it holds
- what each variant changes
- how to use it
- where each app implements it

Figma is the source the values are read from. Code is checked against the contract. Docs are generated from it. The contract is the arbiter between them, and none of them gets edited to match another directly.

The schema is [`schema/component-contract.schema.json`](../schema/component-contract.schema.json) (v2). A filled-in example is [`schema/template.contract.yaml`](../schema/template.contract.yaml). This page is the human version of both.

## Principles

Taken from the writing this format follows: Nathan Curtis, [Component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas) and [Design system conventions in Figma](https://nathanacurtis.substack.com/p/design-system-conventions-in-figma), and Christine Vallaure, [Design system contracts](https://christinevallaure.substack.com/p/design-system-contracts-the-component).

1. **State each decision once.** The variant list and its Figma nodes used to sit in two places that could disagree, and the guidance and implementations in two more. Now they are all in one file.
2. **Author only what can't be generated, and keep it in the contract.** A side file is a second truth that drifts. Authored sections live next to the generated ones, and the generator leaves them alone.
3. **Regenerate deterministically.** Re-reading Figma when nothing changed produces an empty diff, and that is checked. A diff that isn't empty is a real change to review.
4. **States are not props.** Hover, Pressed and Focus come from the browser, not from a caller. They have their own `states` list.
5. **Verifiable over descriptive.** Every value carries its token *and* its resolved value, because six tokens in this kit resolve to `#3a3a3a`. `npm run validate` checks the schema and the cross-references, and conformance checks the CSS.
6. **Version the schema.** `schemaVersion: 2`. A change to the shape is a new version, never a silent edit.

## Anatomy of a contract

```yaml
schemaVersion: 2
id: toggle                  # kebab-case and the file name; unique even when names are not
name: Toggle                # as named in Figma
kind: component             # component | effect | pattern
status: review              # lifecycle, below
summary: …                  # one sentence, shown in the catalogue
category: selection
related: [ icon-button, chips ]

source:                     # where the values were READ from
  tool: figma
  nodeId: "168:1149"        # the component set
  …

props:                      # the API
  selected: { type: boolean, default: false }
states: [ Default, Hover, Pressed, Focus, Disabled ]

elements:                   # every part, in DOM order, with what NEVER varies
  root:
    styles:
      gap: { token: spacing/gap/small, value: 8px }
  focus-ring: {}

variants:                   # one per Figma variant: its configuration, node, and differences only
  - when: { state: Hover, selected: true }
    figmaNode: "168:1159"
    elements:
      root:
        background: { token: actions/primary/hover/background, value: "#00b450" }

guidance: …                 # authored: use, avoid, behaviour, accessibility, content
implementations:            # authored: per app, selectors and that app's deviations
  a-kaunt: { component: src/components/Toggle.tsx, root: .ak-toggle, deviations: […] }
deviations: […]             # authored: departures that apply to every app
pending: …                  # what still has to be read
```

### Generated or authored

| Section | Who writes it |
|---|---|
| `source`, `props`, `states`, `elements.*.styles`, `variants` | **Generated** by the Figma read (`bin/build-contracts.mjs`). Don't hand-edit for Figma-sourced components; change Figma and re-read |
| `summary`, `category`, `related`, `guidance`, `implementations`, `deviations`, `elements.*.notes`, `props.*.notes`, `status` | **Authored**. A re-read never touches them |

Effects (`kind: effect`) and patterns (`kind: pattern`) have no variant matrix, so their contracts are authored throughout. So is a code-born contract (`source.tool: code`), where the implementation is the source until Figma catches up.

### Values

```yaml
gap:      { token: spacing/gap/small, value: 8px }       # the source binds a token
width:    { value: 20px, suggest: spacing/size/xsmall }  # a literal where a token fits
cadence:  { value: 7-8s, untokenised: Motion timing… }   # deliberately literal, and why
```

- **`token`**: the path the source *actually* binds. Never filled in by hand for a Figma-read component. Conformance checks it.
- **`value`**: what CSS resolves to.
- **`suggest`**: a token that *should* be bound. It can be an existing one (bind it in Figma) or a new one (create it first; `npm run validate` lists these as `new`). The Figma read adds suggestions automatically where a literal exactly matches a step of the size or gap scale. Conformance ignores them.
- **`untokenised`**: why a value deliberately has no token. Without one of these fields, an untokenised value counts as an open gap.
- **`assert: false`**: recorded, not checked, as with a root width that is only the Figma frame size.
- **`notes`**: anything surprising.

Layout keywords (`position`, `inset`, `border-sides`, `align-items`, `justify-content`, `overflow`) describe how Figma builds the layer and are never tokenised. [Token coverage](TOKENS.md) classifies every value this way.

### Deviations

A difference nobody declared is **drift**. A declared one is a **decision**. An app's deviation goes under `implementations.<app>.deviations`. A deviation that applies everywhere, such as a design decision Figma hasn't caught up with, goes under top-level `deviations`. Each one has a `why` and says whether it has been `raisedWithDesign`.

## Lifecycle

| Status | Means | To move on |
|---|---|---|
| `skeleton` | Named, node known, nothing read | Read every variant from Figma |
| `draft` | Values read, but some inferred, or `pending` is non-empty | Clear `pending`; every token resolves |
| `review` | Read in full | `guidance.status: agreed`; one implementation conforms with zero undeclared findings |
| `stable` | Safe to build against in any app | Breaking changes need a new major and a migration note |
| `deprecated` | Kept so old builds still resolve | Remove once no implementation references it |

`guidance.status` is either `proposed` (drafted from the contract and common practice, not yet checked by design) or `agreed`. **Proposed guidance is a starting point, not a rule.** Validation refuses `status: stable` while the guidance is only `proposed`.

## Definition of done

A component is `stable` when:

- [ ] `npm run validate` passes with no errors and no token warnings for it
- [ ] `pending` is gone
- [ ] `guidance.status: agreed`, with accessibility covering element, name, keyboard and focus
- [ ] At least one app is listed under `implementations` and conforms with zero undeclared findings
- [ ] Every intentional difference is a deviation with a `why`

## Adding a component

1. **Read it.** With Figma's Dev Mode MCP server running, add the set's node id to `SETS` in `bin/extract.mjs`, its variants to `registry/variant-nodes.json` and its id to `CORE` in `bin/extract-variants.mjs`. Then run `extract-variants.mjs` → `parse.mjs` → `build-contracts.mjs` (add it to `sets` and `NAMES` there too). This writes `contracts/<id>.contract.yaml`. The list is hardcoded in four places for now; collapsing it is on the [roadmap](ROADMAP.md). For an effect or pattern, copy `schema/template.contract.yaml` instead.
2. **Describe it.** Add `summary`, `category`, `related` and `guidance` to the YAML. Leave `guidance.status: proposed` until design has read it.
3. **Register it.** Add each app under `implementations`, with its selectors.
4. **Check it.** Run `npm run validate`, conformance in the app's test suite, and `npm run audit <app-dir>…`. Declare anything you mean to keep as a deviation.
5. **Publish it.** `npm run docs` and commit the contract with the generated docs.

## Checking an app

`src/conform.ts` exports `forApp(contract, app)`, which turns a YAML contract into that app's checkable view: its selectors, every invariant, and the variants keyed as Figma names them. Pass the result to `conform()`.

```ts
import YAML from 'yaml'
import { conform, forApp } from 'rost/conform'

const contract = forApp(YAML.parse(readFileSync('contracts/badge.contract.yaml', 'utf8')), 'a-kaunt')
expect(conform(contract, css, tokensCss)).toEqual([])
```
