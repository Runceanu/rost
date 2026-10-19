# How a contract works

Every component in Rost is one YAML file, `contracts/<id>.contract.yaml`. Everything about the component lives there, once:

- where it came from
- its props and states
- every part, and the values it holds
- what each variant changes
- how to use it
- where each of my apps implements it

Figma is where the values were first read. Code gets checked against the contract, and the docs are built from it. The contract sits in the middle, and nothing gets edited just to match something else.

The format itself is [`schema/component-contract.schema.json`](../schema/component-contract.schema.json). If you'd rather see a filled-in one, start from [`schema/template.contract.yaml`](../schema/template.contract.yaml). This page is the plain-language version of both.

## What I follow

Most of this comes from Nathan Curtis ([component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas), [conventions in Figma](https://nathanacurtis.substack.com/p/design-system-conventions-in-figma)) and Christine Vallaure ([design system contracts](https://christinevallaure.substack.com/p/design-system-contracts-the-component)). What I took from them:

1. **Say each thing once.** The variant list and its Figma nodes used to live in two places that could disagree. The guidance and the app implementations lived in two more. Now it's one file.
2. **Write by hand only what can't be generated, and keep it in the same file.** A side file is a second truth, and second truths drift.
3. **Same input, same output.** Reading Figma again when nothing changed gives an empty diff. If the diff isn't empty, something really changed.
4. **States aren't props.** Hover, pressed and focus come from the browser, not from whoever uses the component. They get their own list.
5. **Check it, don't describe it.** Every value carries its token name *and* what it resolves to, because six tokens here all come out as `#3a3a3a`. `npm run validate` checks the files, the conformance check reads the CSS.
6. **Version the format.** It's `schemaVersion: 2`. If the shape changes, the version changes with it.

## What's in one

```yaml
schemaVersion: 2
id: toggle                  # the file name, kebab-case. Unique, even when names repeat
name: Toggle                # as it's named in Figma
kind: component             # component | effect | pattern
status: review              # see "Where a contract is in its life" below
summary: …                  # one sentence for the catalogue
category: selection
related: [ icon-button, chips ]

source:                     # where the values were read from
  tool: figma
  nodeId: "168:1149"        # the component set, not one variant
  …

props:                      # what a caller can set
  selected: { type: boolean, default: false }
states: [ Default, Hover, Pressed, Focus, Disabled ]

elements:                   # every part, in DOM order, and what never changes
  root:
    styles:
      gap: { token: spacing/gap/small, value: 8px }
  focus-ring: {}

variants:                   # one per Figma variant: when it applies, its node, and only what differs
  - when: { state: Hover, selected: true }
    figmaNode: "168:1159"
    elements:
      root:
        background: { token: actions/primary/hover/background, value: "#00b450" }

guidance: …                 # by hand: when to use it, when not, behaviour, accessibility, content
implementations:            # by hand: where each app builds it, and where it knowingly differs
  a-kaunt: { component: src/components/Toggle.tsx, root: .ak-toggle, deviations: […] }
deviations: […]             # by hand: differences that apply to every app
pending: …                  # what still needs reading
```

### What's generated, what's written by hand

| Section | Who writes it |
|---|---|
| `source`, `props`, `states`, `elements.*.styles`, `variants` | **Generated** by the Figma read (`bin/build-contracts.mjs`). Until the freeze, change Figma and read it again rather than editing these |
| `summary`, `category`, `related`, `guidance`, `implementations`, `deviations`, `elements.*.notes`, `props.*.notes`, `status` | **By hand.** A new read never touches them |

Effects (`kind: effect`) and patterns (`kind: pattern`) have no variant grid, so I write those by hand from top to bottom. Same for anything that started in code (`source.tool: code`). There, the code is the source until Figma catches up.

### Values

```yaml
gap:      { token: spacing/gap/small, value: 8px }       # the source uses a token
width:    { value: 20px, suggest: spacing/size/xsmall }  # a plain number where a token fits
cadence:  { value: 7-8s, untokenised: Motion timing… }   # plain on purpose, and why
```

- **`token`** is the token the source actually uses. I never fill it in by hand for something read from Figma. The conformance check tests it.
- **`value`** is what CSS ends up with.
- **`suggest`** is a token that *should* be there. Either it exists and Figma just isn't using it, or it doesn't exist yet and needs creating (`npm run validate` lists those as `new`). The Figma read adds these by itself when a plain number matches a step on the size or gap scale exactly. The conformance check ignores them.
- **`untokenised`** says why a value has no token on purpose. Without it, a value with no token shows up as an open gap.
- **`assert: false`** means it's written down but not checked, like a root width that's only the size of the Figma frame.
- **`notes`** is for anything that would surprise you.

Some properties are just how Figma builds a layer: `position`, `inset`, `border-sides`, `align-items`, `justify-content`, `overflow`. Nobody tokenises those, so they're never counted as gaps. [Token coverage](TOKENS.md) sorts every value this way.

### Deviations

If code differs from the contract and nobody wrote it down, that's drift. If it's written down, it's a decision. An app's own difference goes under `implementations.<app>.deviations`. A difference that applies everywhere, like a choice Figma hasn't caught up with yet, goes under the top-level `deviations`. Each one needs a `why`, and `raisedWithDesign` says whether it's been taken back to the design side yet.

### After the freeze

Figma was the source while I imported the kit. `node bin/freeze.mjs --apply` ends that. It turns every `suggest` into the `token` and stamps `source.frozenAt` on each contract. From then on the contract is the source: the Figma read leaves it alone (unless I pass `--unfreeze`, on purpose), every section counts as written by hand, and a change is an edit to the YAML. `source` stays as a note of where the values came from first.

## Where a contract is in its life

| Status | Means | To move on |
|---|---|---|
| `skeleton` | Named, node known, nothing read yet | Read every variant |
| `draft` | Read, but some values are guessed or `pending` isn't empty | Clear `pending`, make every token resolve |
| `review` | Read in full | Guidance signed off (`agreed`), and one app passes the check with nothing undeclared |
| `stable` | Safe to build on in any app | Breaking changes need a new major version and a note on how to move over |
| `deprecated` | Kept so old builds still work | Delete once nothing uses it |

`guidance.status` is `proposed` (a first draft from the contract and common practice) or `agreed` (I've read it and I stand by it). Proposed guidance is somewhere to start, not a rule. Validation won't let a contract be `stable` while its guidance is still `proposed`.

## When it's done

A component is `stable` when:

- [ ] `npm run validate` passes with no errors and no token warnings for it
- [ ] `pending` is gone
- [ ] the guidance is `agreed`, and its accessibility part covers element, name, keyboard and focus
- [ ] at least one app is listed under `implementations` and passes the check with nothing undeclared
- [ ] every difference I mean to keep is a deviation with a `why`

## Adding a component

1. **Read it.** With the Figma desktop app open on the UI Kit, add the component's variants to `registry/variant-nodes.json`. Then run `node bin/extract-variants.mjs <id>`, `node bin/parse.mjs` and `node bin/build-contracts.mjs` (add the id to `sets` and `NAMES` in that last one). That writes `contracts/<id>.contract.yaml`. The list still lives in a few places, and fixing that is on the [roadmap](ROADMAP.md). For an effect or a pattern, copy `schema/template.contract.yaml` instead.
2. **Describe it.** Add `summary`, `category`, `related` and `guidance`. Leave the guidance `proposed` until I've signed it off.
3. **Register it.** Add each app under `implementations`, with its selectors.
4. **Check it.** `npm run validate`, the conformance test in the app, and `npm run audit <app-dir>`. Anything that's different on purpose becomes a deviation.
5. **Publish it.** `npm run docs`, then commit the contract and the rebuilt docs together.

## Checking an app

`src/conform.ts` has `forApp(contract, app)`. It turns a YAML contract into what one app should look like: that app's selectors, every fixed value, and the variants named the way Figma names them. Hand the result to `conform()`.

```ts
import YAML from 'yaml'
import { conform, forApp } from 'rost/conform'

const contract = forApp(YAML.parse(readFileSync('contracts/badge.contract.yaml', 'utf8')), 'a-kaunt')
expect(conform(contract, css, tokensCss)).toEqual([])
```
