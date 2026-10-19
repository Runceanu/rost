# Roadmap

What Rost does next, in order. Each item says what "done" looks like, so it can be checked off rather than argued about.

Baseline from `npm run audit` against both apps on 2026-10-19:

| | Raw hex | Undefined vars | Off-kit token names |
|---|---|---|---|
| akount.ing | 0 | 0 | 5 |
| runceanu.com | 230 | 2 | 83 |

## Now: make the contract trustworthy

1. **Triage A-kaunt's conformance findings.** As of 2026-10-19, against the YAML contracts: Badge 0, InlineBanner 10, Input 15, Toggle 36, PillButton 47. Two causes are known:
   - **Real drift:** the primary PillButton has no 1px top/left edge (`border-top-width: spacing/outline/small`, `border-color: actions/primary/*/outline`). Only the secondary edge shipped, and the contracts couldn't show this until the parser stopped dropping `border-t` and rgba borders.
   - **Checker limit:** A-kaunt draws the selected Toggle's edge on `::before`, and conformance reads only the root selector. Teach `implementations.*.parts` to map a root property to a pseudo-element.

   Multi-axis variants already work. *Done when* every remaining finding is fixed or declared as a deviation.
2. **Bind the suggested tokens in Figma.** 37 values carry a suggestion, all exact matches: 36 icon-frame sizes and Input's leading gap. Binding them needs write access to the UI Kit file. The Dev Mode server can only read it, so connect the Figma plugin, bind the variables, and re-read; each suggestion then becomes a token. Applied on 2026-10-19 without Figma: the Paper ink and stroke now read `opacity/mild` and `spacing/outline/medium` in runceanu.com's code, and `spacing/layout/hero-height` (630px) exists in `tokens.css`. That last one still needs a Figma variable, and the seven case-study stylesheets still state 630px as a literal.
3. **Export every Figma variable.** `tokens.css` holds 153 of the file's 582 variables. `opacity/strong` was added by hand on 2026-10-19 because Chip needed it. The rest, including the `project/*` set behind IconButton's Project type, the colour primitives and the typography scale, need a real export. Add the missing `bin/build-tokens.mjs`, generate `tokens.css` and `tokens.json` from the Figma variables, and key `tokens.json` on the Figma names so hyphens survive (`non-interactive`, not `non/interactive`).
4. **One component list.** Node ids are hardcoded in `extract.mjs`, `extract-variants.mjs`, `build-contracts.mjs` and `variant-nodes.json`. Drive all four from `registry/component-sets.json`, so adding a component means touching one file.
5. **Normalise variants into layers.** A variant list repeats what one axis decides. Toggle's unselected background appears five times, once per state. Curtis's layered configurations (`when: { selected: false }` once, then `when: { state: Disabled }` on top) would state each decision once, and cut most of Button's 156 variant values. This needs `conform.ts` to apply layers in order.
6. **Sync A-kaunt's contract copies.** A-kaunt still tests against its own JSON copies of Badge and Button. Point its test at these YAML contracts through `forApp`, so there is one copy.
7. **Review the guidance with design.** All 16 pages are `proposed`. Take the four undeclared-to-design deviations (Docs Health lists them) into the same review.

## Finish the Figma import

Started 2026-10-19 and stopped by Figma's daily limit on Dev Mode reads ("try again tomorrow"). Done: six new contracts, 156 of 188 variant screenshots in `baseline/`, 75 icon and vector SVGs in `assets/figma/`. Still to do:

- Screenshots of the 24 illustrations and Divider: `node bin/capture-baseline.mjs illustrations divider`.
- SVG exports of the 17 icons and 24 illustrations, as files in `assets/`.
- **Then freeze: the contracts become the source** (decided 2026-10-19). Run `node bin/freeze.mjs --apply`. Every suggestion becomes a token (106 in the dry run, all of them existing tokens), and every contract gets `source.frozenAt`. From then on Figma is history: the Figma read skips frozen contracts, and changes are made in the YAML, reviewed, and checked against code. Figma is not edited to match.
- Change the Thumbs sample client name in Figma to "Client" and recapture, so its baseline can be published. Until then `baseline/thumbs/` stays local, as does `baseline/testimonials-pics/` (real people's photos).

## Next: grow the kit

Ordered by how much duplicated code each one removes.

| Component | Why now | Source |
|---|---|---|
| **Hero Media** as a shared component | The same hero CSS is repeated in 7 case-study stylesheets | contract exists |
| **Icons** | 26 in Figma, 1 exported. InlineBanner can't ship its glyphs without them | `92:15`, raw pulled |
| **Divider** | A-kaunt already has `Divider.tsx` | **Contract read 2026-10-19** |
| **Thumbs, Carousel, Projects** | runceanu.com's home page; most of its raw hex lives in `CarouselCard.css` | **Contracts read 2026-10-19** |
| **Testimonials, TestimonialPicture** | runceanu.com | **Contracts read 2026-10-19** |
| **ListRow** | A-kaunt builds it outside the kit with undeclared slots | needs a Figma component first |
| **Tooltip** | IconButton guidance depends on it | needs a Figma read |
| **Switch, Textarea, selected Chip** | Gaps the guidance already points at | need design first |

Then **port runceanu.com onto kit token names**. *Done when* its raw-hex count in the audit is 0, like akount.ing's.

## Later: from the workshop ideas

The workshop board's ideas, translated to a two-app personal kit. Skipped: the team-process ones (governance, rituals, roles, QA alignment).

| Idea on the board | Here, that means |
|---|---|
| Specs definition, templates for all issue types | `schema/template.contract.yaml` and `npm run validate` exist. Add issue templates for *new component*, *deviation* and *token change* once the repo has a remote |
| Documentation unification; move Figma docs to markdown; documentation skill | Done in part: `docs/components/*.md` is generated markdown an agent can read. Next, a Claude skill that loads the relevant page before building a component in either app |
| Figma changelog generation; improve changelog | Generate `CHANGELOG.md` from contract diffs between tags, e.g. "Badge: outline token changed from X to Y", not from commit messages |
| Figma version control | Record the Figma file version in `source` on each read, so a re-read can say what changed in Figma since the last one |
| Spec-driven development; issue review & validation; PR review | CI on every push: `npm run validate`, rebuild docs and fail on a diff, run conformance in both apps |
| Vibe coding for designers; designers manage repos | The CONTRACT.md "Adding a component" flow, reduced to one command per step |
| Charts approach; tanstack charts spike | akount.ing will need charts: a data-viz token set (categorical, sequential, diverging) and a Chart contract before any chart is built |
| Device-specific topics | Breakpoint and density tokens. The kit has none yet |
| Metrics / ideal-data scenario | Track the audit table above over time in docs Health, so adoption is a number, not a feeling |
