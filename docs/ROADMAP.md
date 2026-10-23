# Roadmap

What I'm doing next with Rost, in order. Each item says what "done" looks like, so I can tick it off instead of arguing with myself about it.

Where the apps stood on 2026-10-22 (`npm run audit` on both):

| | Raw hex | Undefined vars | Token names the kit doesn't have |
|---|---|---|---|
| akount.ing | 0 | 0 | 0 |
| runceanu.com | 99 | 2 | 78 |

runceanu.com's raw hex dropped from 230 to 99 without me touching the site. The audit used to count hex inside comments and `transparent`; now it doesn't. The 99 are real. The unknown-token counts fell too, for the same kind of reason: the audit now counts Rost's own tokens (the effects, the shadow) as the kit's, not only Figma's variables. akount.ing passes `--strict` now, and its tokens are resynced from Rost.

## Done: the freeze

On 2026-10-20 the contracts became the source. The import was finished: 22 contracts and 192 screenshots from Figma (every variant, the 17 icons and the 24 illustrations). `bin/freeze.mjs` turned all 122 suggestions into tokens (every one of them a token that already existed) and stamped each contract with the date. The Figma read skips them now, and I won't edit Figma to match. If I ever need Figma again for one component, `--unfreeze` is there, on purpose.

Still open from Figma:

- Rename the sample client in Thumbs to "Client" and capture it again, so `baseline/thumbs/` can be public. Until then the visual test leaves the name out of the comparison. `baseline/testimonials-pics/` stays private for good (real people's photos).
- Keep one Button set: 20:14, with its icon slot. The label-only set at 39:38 is the same button and can go.
- Replace TestimonialPicture's eight sample photos (144:493) with one 56px component whose image is a slot, and give Testimonials' picture slot that, empty. Then `baseline/testimonials-pics/` has nothing private left.
- Testimonials' sample quote says "This is where the testimonials comes". Rost says "This is where the testimonial goes". Change the `testimonial` property's default on the set (node 144:67) and capture the open variants again; until then the test leaves the quote out.
- The Menu effect's blur. I took 12px from the nav, not from the "Menu" style, so that contract is still a draft.
- A few values have no token and no reason yet. They're at the bottom of [Token coverage](TOKENS.md).

## Done: a real website

On 2026-10-20 rost.build became a proper site, the way shadcn's is: a homepage, a page per component, tokens, icons, and these docs. It's built with Astro from `web/`, straight from the contracts, so it can't drift from them. Every component card on it is a Thumbs, with a glimpse of the component inside. Components that are in code show up live on their cards and pages, with a Code tab. The rest say "Not in code yet" on their card, and their pages show Figma's own renders until they're built. Button has none to show (its renders came back empty), and TestimonialPicture's stay private.

## Now: Rost in code

Fifteen components so far, all built from their contracts and checked against Figma in the visual test:

- **InlineBanner**, all 8 variants, with Figma's own icons.
- **Badge**, all 8 variants. Figma gave it a small size since August: just the coloured dot. The dot in front of the label on the medium size is optional now.
- **Thumbs**, all 6 states. It's the first one with hover, pressed and focus, so the visual test now forces those through Chrome's DevTools protocol. The "Coming soon" pill on a disabled card is the Badge.
- **Divider, Tag, Chip, Button, IconButton, Toggle.** 61 variants, all matching except Chip Pressed (2.62% against the 2.5% line: arc anti-aliasing, and text that sits about a pixel higher in Chrome).
- **Carousel, Projects, Testimonials, Menu.** 26 variants, all matching except Projects Hover (see below). Testimonials is a disclosure: its header is the button, so the contract says which part its focus and disabled states come from (`stateSelectors`).
- **Button** is PillButton's set with the icon made optional. Figma has the same button twice (20:14 with an icon slot, 39:38 without), so on 2026-10-23 I made them one.
- **Input**, all 14 variants. A press anywhere in the field puts the caret in it, since the empty input is 0px tall under its label. The clear button is Rost's IconButton.
- **TestimonialPicture.** The photo is a slot. Figma's eight variants are eight real people, so the test masks the photo and only the 56px frame is compared, and the site shows landscapes instead.

The effects are in code too, as tokens: Thumb, Menu, Lock frame and Floating each show on the site applied to real components. The Paper effect isn't. It's a canvas animation that lives in runceanu.com, and only its numbers are tokens.

Building them turned up four things to fix:

- **The parser took the wrong branch.** Where Figma guards a layer per state, it kept Default's values for every state. Toggle's off side said hover, pressed and disabled all look like Default. The pixels and the raw read say otherwise, so I fixed Toggle by hand. Projects and Menu had the same problem, and Carousel had lost its description line. Each one now reads its values from its own branch of the Figma read. Input had it too: read again on 2026-10-23, every variant now comes from its own branch.
- **Some Figma reads were never reads.** Carousel's Default came back as a Code Connect prompt and was saved as if it were code. Its values came from the other states' reads, which all carry Default's branch. Input's icons were never saved before their links expired. They're saved now.
- **Figma's code and Figma's render disagree, twice.** Menu's description renders at 14px in four states while the code says 16px, and Projects' hovered details render #d3d9d5 while the code says #ededed. Both look like variable modes on those frames. I followed the render for Menu, where it matches a token exactly. For Projects Hover I kept #ededed, the same as Thumbs and Carousel, and I'm fixing the frame in Figma. Its test fails until that screenshot is captured again.
- **Text sat about a pixel higher in Chrome than in Figma.** General Sans' metrics (ascent 1010, descent 240, line gap 100) get split differently. Since 2026-10-23 Rost ships its own `@font-face` (`tokens/fonts.css`) with `ascent-override: 106%` and `descent-override: 28%`, measured across every built component. The share of pixels that differ from Figma halved, and akount.ing and runceanu.com use the same three lines.

Next, one at a time on the same setup:

- **Hero Media.** No Figma render yet. It'll take its artwork as a slot, and needs something to test against first.
- **runceanu.com onto Rost's components**, with `npm run add`. It copies a component, what it imports, its contract and the check into an app, the way shadcn does, and updates them on a second run. akount.ing uses it for Badge, InlineBanner, Divider and Button since 2026-10-22. A real `npx rost add` waits until Rost is published to npm.

## Now: make the contracts something I can trust

1. **Go through akount.ing's conformance findings.** Against the YAML contracts on 2026-10-19: Badge 0, InlineBanner 10, Input 15, Toggle 36, PillButton (Button now) 47. I know two of the causes:
   - **Real drift.** The primary PillButton (Button now) has no 1px top and left edge (`border-top-width: spacing/outline/small`, `border-color: actions/primary/*/outline`). Only the secondary one shipped. The contracts couldn't show it until the parser stopped dropping `border-t` and rgba borders.
   - **A limit of the check.** akount.ing draws the selected Toggle's edge on `::before`, and the check only reads the root selector. `implementations.*.parts` needs a way to point a root property at a pseudo-element.

   *Done when* every finding left is either fixed or written down as a deviation. Each component that gets to zero can go stable. Badge got there first, then went back to `review` when Figma changed it.
2. **Export every Figma variable.** [Token coverage](TOKENS.md) keeps the count of how many of the file's 582 variables `tokens.css` has. I added the ones the contracts needed by hand (`opacity/strong`, the `project/*` set, title typography). On 2026-10-21 I found 35 more colour variables I'd read from Figma on 2026-10-19 and never exported: every `actions/*/icon`, `input/*/icon`, `project/*/icon`, `non-interactive/foreground/contrast` and `Base/Black`. Three times a colour got called "no token" when Figma had one, because only `tokens.css` was searched. A "no token" claim now gets checked against what Figma gave (`raw/*.get_variable_defs.txt`), not against what happened to be exported. The colour primitives, the rest of the typography scale and more are still missing. That needs a proper `bin/build-tokens.mjs`, keyed on the Figma names so hyphens survive (`non-interactive`, not `non/interactive`). The freeze came first, so this is one last read of the variables. It doesn't make Figma the source again.
3. **One list of components.** `registry/component-sets.json` drives the contracts now, but the variant nodes still sit apart in `variant-nodes.json`. One file should hold both.
4. **Variants as layers.** Right now a variant list repeats what one axis decides: Toggle's unselected background shows up five times, once per state. Curtis's layered approach (`when: { selected: false }` once, then `when: { state: Disabled }` on top) says it once and would cut most of Button's variant list. The check needs to apply layers in order first.
5. **One copy of the contracts.** akount.ing still tests against its own old JSON copies of Badge and Button. Its test should read these YAML files through `forApp` instead.
6. **Guidance for the new components, and Badge again.** I signed off 16 on 2026-10-19, and Badge went back to `proposed` when Figma gave it a dot-only size. Thumbs, Carousel, Projects, Testimonials, Menu and Divider have proposed ones now, waiting for me. TestimonialPicture has none. While I'm at it, decide on the four deviations nobody has taken back to the design side yet (the Health section lists them).

## Next: grow the kit

In order of how much copied code each one removes.

| Component | Why now | Where it stands |
|---|---|---|
| **Hero Media** as a shared component | The same hero CSS is copied into 7 case-study stylesheets | contract exists |
| **Icons** as a component | The 17 SVGs are exported (`assets/icons/`), but there's no `Icon` component yet, and the apps draw their own | SVGs exported, component next |
| **TestimonialPicture** | runceanu.com's testimonials. Divider, Carousel, Projects, Testimonials and Thumbs are done | contract read 2026-10-19 |
| **ListRow** | akount.ing builds it outside the kit | needs designing first |
| **Tooltip** | IconButton's guidance leans on it | needs designing first |
| **Switch, Textarea, a selected Chip** | The guidance already says they're missing | need designing first |

After that, **move runceanu.com onto the kit's token names.** *Done when* its raw hex count is 0, like akount.ing's.

## Later

Ideas from a workshop board I sat in on, shrunk down to a personal kit with two apps. I skipped the team-process ones.

| The idea | What it means here |
|---|---|
| Spec templates for every kind of issue | The template contract and `npm run validate` are there. Add GitHub issue templates for *new component*, *deviation* and *token change* |
| One place for docs, docs in markdown, a docs skill | Partly done: `docs/components/*.md` is markdown an agent can read. Next, a Claude skill that loads the right page before building a component in either app |
| A better changelog | Build `CHANGELOG.md` from what changed in the contracts ("Badge: outline token went from X to Y"), not from commit messages |
| Spec-driven work, PR checks | CI on every push: validate, rebuild the docs and fail if they changed, run the check in both apps |
| Designers working in code | The "Adding a component" steps in [CONTRACT.md](CONTRACT.md), down to one command each |
| Charts | akount.ing will need them. Tokens for data-viz colours and a Chart contract come before any chart |
| Device-specific work | Breakpoint and density tokens. There are none yet |
| Measuring it | Track the audit table at the top over time, so adoption is a number and not a feeling |
