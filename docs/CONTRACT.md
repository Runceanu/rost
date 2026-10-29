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

## Why contracts, not just tokens

Tokens alone didn't stop the drift. I built the first Badge in the accounting app by guessing the component from its tokens instead of reading the Figma node. It came out wrong in three places at once: a background fill the kit doesn't have, a coloured label where the kit keeps it grey, and an outline from the wrong token family.

A contract writes down what was read, and from which node, and the check fails when code stops matching. It compares token names, not just pixels. Six tokens here come out as `#3a3a3a`, and a screenshot can't tell the right one from the wrong one.

The same file is what an agent needs when it builds UI, Claude or any other. It reads one file per component instead of guessing from a screenshot:

- every value names its token, and a value with no token says why, so there's nothing left to make up
- `guidance` says when not to use a component and what to use instead, which is the call a model gets wrong most often
- the accessibility part gives the element, the name, the keys and the focus, so the markup isn't a styled `div`
- `status` says what's safe to build on, and deviations say which differences are meant, so a mismatch on purpose doesn't get "fixed"
- the check is something it can run: build, check, fix the findings, stop when there are none

[`docs/components/`](components/) has each contract as markdown, ready to load as context.

## What I follow

Most of this comes from Nathan Curtis ([component contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas), [conventions in Figma](https://nathanacurtis.substack.com/p/design-system-conventions-in-figma)) and Christine Vallaure ([design system contracts](https://christinevallaure.substack.com/p/design-system-contracts-the-component)). What I took from them:

1. **Say each thing once.** The variant list and its Figma nodes used to live in two places that could disagree. The guidance and the app implementations lived in two more. Now it's one file.
2. **Write by hand only what can't be generated, and keep it in the same file.** A side file is a second truth, and second truths drift.
3. **Same input, same output.** Reading Figma again when nothing changed gives an empty diff. If the diff isn't empty, something really changed.
4. **States aren't props.** Hover, pressed and focus come from the browser, not from whoever uses the component. They get their own list.
5. **Check it, don't describe it.** Every value carries its token name *and* what it resolves to. `npm run validate` checks the files, the conformance check reads the CSS.
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
stateSelectors:             # only where a state isn't its plain pseudo-class
  Pressed: ":is(:active, [aria-current=\"page\"])"   # Button: the page you're on looks pressed

elements:                   # every part, in DOM order, and what never changes
  root:
    styles:
      gap: { token: spacing/gap/small, value: 8px }
  focus-ring: {}

variants:                   # when each applies, and only what differs. Layers first, then one per Figma variant
  - when: { selected: false }   # a layer: every variant that's off
    elements:
      root:
        border-radius: { token: spacing/radius/medium, value: 12px }
  - when: { state: Hover, selected: true }
    figmaNode: "168:1159"
    elements:
      root:
        background: { token: actions/primary/hover/background, value: "#00b450" }

guidance: …                 # by hand: when to use it, when not, behaviour, accessibility, content
implementations:            # by hand: where each app builds it, and where it knowingly differs
  accounting-app: { component: src/rost/toggle/Toggle.tsx, root: .rost-toggle, deviations: […] }
deviations: […]             # by hand: differences that apply to every app
pending: …                  # what still needs reading
```

### What's generated, what's written by hand

| Section | Who writes it |
|---|---|
| `source`, `props`, `states`, `elements.*.styles`, `variants` | **Generated** by the Figma read (`bin/build-contracts.mjs`) until the freeze. Every contract was frozen on 2026-10-20, so these are edited by hand now too |
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
- **`suggest`** is a token that *should* be there but isn't used yet. The freeze turned all 122 into tokens, so there are none left. The check ignores them.
- **`untokenised`** says why a value has no token on purpose. Without it, a value with no token shows up as an open gap.
- **`assert: false`** means it's written down but not checked, like a root width that's only the size of the Figma frame.
- **`notes`** is for anything that would surprise you.

Some properties are just how Figma builds a layer: `position`, `inset`, `border-sides`, `align-items`, `justify-content`, `overflow`. Nobody tokenises those, so they're never counted as gaps. [Token coverage](TOKENS.md) sorts every value this way.

### Variants as layers

A Figma variant set is a grid: Toggle is five states times on and off. Written out cell by cell, every variant repeats what its row already decides, so Toggle's off shape used to show up five times, once per state. Now a `when` can name some of the axes and leave the others out:

```yaml
variants:
  - when: { selected: false }                    # every variant that's off
    elements:
      root:
        border-radius: { token: spacing/radius/medium, value: 12px }
  - when: { state: Disabled }                    # every disabled one, on or off
    elements:
      root:
        opacity: { token: opacity/gentle, value: "0.24" }
  - when: { state: Disabled, selected: false }   # one Figma variant
    figmaNode: "168:1183"
    elements: …
```

How it's read:

- An entry applies to every variant whose `when` has all of its conditions. `{ selected: false }` applies to `{ state: Disabled, selected: false }`, not to `{ state: Disabled, selected: true }`.
- An entry whose `when` sits inside another entry's is a **layer**. It isn't a variant of its own, so it has no `figmaNode`. Everything else is a variant: one per Figma variant, plus any Figma doesn't draw, like Toggle's `{ labelled: true }`.
- A variant gets its layers from the least specific to the most, and its own values last. Between two layers that name as many conditions, the later one wins.
- I put the layers first and the variants after, so the file reads in the order it's applied.

Every reader goes through the same function, `variantsOf` in `bin/lib/kit.mjs` (with a copy in `src/conform.ts`, which can't import it). `bin/build-css.mjs` writes one rule per variant with its layers already in, so the selectors are the same as when each variant was written out in full. The site's variant table and `forApp` show the variants the same way, with layers applied. `npm run validate` fails on two entries with the same `when`, and on a layer with a `figmaNode`.

Two variants that can both be true at once (a labelled toggle that's also disabled) stay two rules in CSS, and the cascade decides between them.

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

1. **Start it.** Since the freeze, a new component can start in the contract: copy `schema/template.contract.yaml`. If it starts in Figma instead, open the Figma desktop app on the UI Kit, add the set to `registry/component-sets.json`, with a `name` and its `variants`, then run `node bin/extract-variants.mjs <id>`, `node bin/parse.mjs` and `node bin/build-contracts.mjs`. That writes `contracts/<id>.contract.yaml`.
2. **Describe it.** Add `summary`, `category`, `related` and `guidance`. Leave the guidance `proposed` until I've signed it off.
3. **Register it.** Add each app under `implementations`, with its selectors.
4. **Check it.** `npm run validate`, the conformance test in the app, and `npm run audit -- <app-dir>`. Anything that's different on purpose becomes a deviation.
5. **Publish it.** `npm run docs`, then commit the contract and the rebuilt docs together.

## From contract to code

A component in code is built from its contract, not from memory.

1. `npm run css -- <id>` writes `src/components/<id>/<id>.css` straight from the contract. Every part gets a class, every prop value a modifier, every value its token. Hover and pressed skip a disabled item, inside `:where()` so the rule weighs what it did. I don't edit that file. If the CSS is wrong, the contract is wrong, and that's where I fix it.
2. The React component sits next to it and follows the Figma layers one to one, so the classes land on the same parts.
3. `<id>.fixtures.tsx` lists one example per Figma variant. Hover, pressed and focus aren't props, so a fixture names them in `force` and the test puts them on the element through Chrome's DevTools protocol, the way the `:hov` panel does. Pages are served over http, as on the site, because a browser won't apply a CSS mask from a `file://` page. A fixture can also `mask` a box the test shouldn't compare, like Thumbs' sample name, which shows a real client in Figma.
4. `npm run test:visual -- <id>` renders each one in Chrome, on the same dark background Figma uses, with the same General Sans Variable font, and compares it with Figma's own screenshot from `baseline/`. It saves a side by side for each variant in `test-results/visual/<id>/`: Figma, mine, and the difference in red.

A variant passes when its size is exact and almost nothing differs. Figma and Chrome never draw letter edges quite the same, so up to 2.5% of pixels may differ, allowing a pixel either way. That alone let IconButton pass with its arrow missing, so the pixels that differ also can't touch each other in a clump bigger than 32: text edges differ in specks, a missing part in one piece. A component that hugs its text is rounded up to a whole pixel first, as Figma does. Neither line sees a missing part on a disabled variant, which is too faint to tell. The results go to `baseline/results.json`, which rost.build reads for the dots in its sidebar.

## Checking an app

`npm run add -- <app-dir> <id>` copies the component, its contract (the same YAML) and `src/conform.ts` into the app, the way shadcn does: the app owns the copies, and running it again updates them. `src/conform.ts` has `forApp(contract, app)`. It turns a YAML contract into what one app should look like: that app's selectors, every fixed value, and the variants named the way Figma names them. Hand the result to `conform()`.

```ts
import { readFileSync } from 'node:fs'
import YAML from 'yaml'
import { conform, forApp } from 'rost/conform'

const contract = forApp(YAML.parse(readFileSync('contracts/badge.contract.yaml', 'utf8')), 'accounting-app')
expect(conform(contract, css, tokensCss)).toEqual([])
```

Pass a variant to check that one too: `conform(contract, css, tokensCss, 'status=Negative, size=Small')`. Loop over `Object.keys(contract.variants)`, which has every whole variant with its layers in, not over the YAML's `variants`, where a layer like `size=Small` isn't a variant of its own. It looks for the modifier classes Rost's own CSS uses (`.rost-badge--status-negative`). An app that names them by value alone (`.ak-badge--negative`) adds `{ modifiers: 'value' }` at the end. It reports three kinds of finding: a value that's missing, a value that's different, and the right value from the wrong token. The last one is the reason the check exists.
