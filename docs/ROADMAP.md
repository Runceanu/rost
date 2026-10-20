# Roadmap

What I'm doing next with Rost, in order. Each item says what "done" looks like, so I can tick it off instead of arguing with myself about it.

Where the apps stood on 2026-10-19 (`npm run audit` on both):

| | Raw hex | Undefined vars | Token names the kit doesn't have |
|---|---|---|---|
| The accounting app | 0 | 0 | 5 |
| The portfolio site | 230 | 2 | 83 |

## Done: the freeze

On 2026-10-20 the contracts became the source. The import was finished: 22 contracts, all 192 variant screenshots, the 17 icons and the 24 illustrations. `bin/freeze.mjs` turned all 122 suggestions into tokens (every one of them a token that already existed) and stamped each contract with the date. The Figma read skips them now, and I won't edit Figma to match. If I ever need Figma again for one component, `--unfreeze` is there, on purpose.

Still open from Figma:

- Rename the sample client in Thumbs to "Client" and capture it again, so `baseline/thumbs/` can be public. `baseline/testimonials-pics/` stays private for good (real people's photos).
- Seven values have no token and no reason yet. They're at the bottom of [Token coverage](TOKENS.md).

## Now: Rost in code

Two components so far, both built from their contracts and both matching Figma in the visual test:

- **InlineBanner**, all 8 variants, with Figma's own icons.
- **Badge**, all 8 variants. Figma gave it a small size since August: just the coloured dot. The dot in front of the label on the medium size is optional now.

Next, one at a time on the same setup (CSS from the contract, the component, fixtures, the visual test):

- **Button, PillButton, IconButton, Toggle, Chip, Tag.** These have hover, press and focus, so the test needs to trigger those states first.
- **Input, Menu, and the the portfolio site ones** (Carousel, Projects, Thumbs, Testimonials).
- **Publish it as a package** that the accounting app and the portfolio site install, instead of keeping their own copies.

## Now: make the contracts something I can trust

1. **Go through the accounting app's conformance findings.** Against the YAML contracts on 2026-10-19: Badge 0, InlineBanner 10, Input 15, Toggle 36, PillButton 47. I know two of the causes:
   - **Real drift.** The primary PillButton has no 1px top and left edge (`border-top-width: spacing/outline/small`, `border-color: actions/primary/*/outline`). Only the secondary one shipped. The contracts couldn't show it until the parser stopped dropping `border-t` and rgba borders.
   - **A limit of the check.** the accounting app draws the selected Toggle's edge on `::before`, and the check only reads the root selector. `implementations.*.parts` needs a way to point a root property at a pseudo-element.

   *Done when* every finding left is either fixed or written down as a deviation. Each component that gets to zero can go stable, the way Badge did.
2. **Export every Figma variable.** `tokens.css` has 180 of the file's 582. I added the ones the contracts needed by hand (`opacity/strong`, the `project/*` set, title typography). The colour primitives, the rest of the typography scale and more are still missing. That needs a proper `bin/build-tokens.mjs`, keyed on the Figma names so hyphens survive (`non-interactive`, not `non/interactive`). Worth doing before the freeze, while Figma is still the source.
3. **One list of components.** Node ids live in `extract.mjs`, `build-contracts.mjs` and `variant-nodes.json`. One file should drive all of it.
4. **Variants as layers.** Right now a variant list repeats what one axis decides: Toggle's unselected background shows up five times, once per state. Curtis's layered approach (`when: { selected: false }` once, then `when: { state: Disabled }` on top) says it once and would cut most of Button's 156 variant values. The check needs to apply layers in order first.
5. **One copy of the contracts.** the accounting app still tests against its own old JSON copies of Badge and Button. Its test should read these YAML files through `forApp` instead.
6. **Guidance for the six new components.** I signed off the other 16 on 2026-10-19. Carousel, Projects, Thumbs, Testimonials, TestimonialPicture and Divider still need theirs. While I'm at it, decide on the four deviations nobody has taken back to the design side yet (the Health section lists them).

## Next: grow the kit

In order of how much copied code each one removes.

| Component | Why now | Where it stands |
|---|---|---|
| **Hero Media** as a shared component | The same hero CSS is copied into 7 case-study stylesheets | contract exists |
| **Icons** | 17 in Figma, only the lock in code. InlineBanner can't show its glyphs without them | SVG export is next |
| **Divider** | The accounting app already has its own `Divider.tsx` | contract read 2026-10-19 |
| **Thumbs, Carousel, Projects** | The portfolio site's home page, and where most of its raw hex lives | contracts read 2026-10-19 |
| **Testimonials, TestimonialPicture** | The portfolio site | contracts read 2026-10-19 |
| **ListRow** | The accounting app builds it outside the kit | needs designing first |
| **Tooltip** | IconButton's guidance leans on it | needs designing first |
| **Switch, Textarea, a selected Chip** | The guidance already says they're missing | need designing first |

After that, **move the portfolio site onto the kit's token names.** *Done when* its raw hex count is 0, like the accounting app's.

## Later

Ideas from a workshop board I sat in on, shrunk down to a personal kit with two apps. I skipped the team-process ones.

| The idea | What it means here |
|---|---|
| Spec templates for every kind of issue | The template contract and `npm run validate` are there. Add GitHub issue templates for *new component*, *deviation* and *token change* |
| One place for docs, docs in markdown, a docs skill | Partly done: `docs/components/*.md` is markdown an agent can read. Next, a Claude skill that loads the right page before building a component in either app |
| A better changelog | Build `CHANGELOG.md` from what changed in the contracts ("Badge: outline token went from X to Y"), not from commit messages |
| Spec-driven work, PR checks | CI on every push: validate, rebuild the docs and fail if they changed, run the check in both apps |
| Designers working in code | The "Adding a component" steps in [CONTRACT.md](CONTRACT.md), down to one command each |
| Charts | The accounting app will need them. Tokens for data-viz colours and a Chart contract come before any chart |
| Device-specific work | Breakpoint and density tokens. There are none yet |
| Measuring it | Track the audit table at the top over time, so adoption is a number and not a feeling |
