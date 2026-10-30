# Roadmap

What I'm doing next with Rost, in order. Each item says what "done" looks like, so I can tick it off instead of arguing with myself about it.

Where the apps stood on 2026-10-26 (`npm run audit` on both):

| | Raw hex | Undefined vars | Token names the kit doesn't have |
|---|---|---|---|
| The accounting app | 0 | 0 | 0 |
| The portfolio site | 0 | 0 | 0 |

On 2026-10-22 the portfolio site still had 99 raw hex values, 2 undefined vars and 78 unknown token names. On 2026-10-26 it got to zero on all three, and since then its CI runs the strict audit on every push, the way the accounting app's does.

## Done: the freeze

On 2026-10-20 the contracts became the source. The import was finished: 22 contracts and 192 screenshots from Figma (every variant, the 17 icons and the 24 illustrations). `bin/freeze.mjs` turned all 122 suggestions into tokens (every one of them a token that already existed) and stamped each contract with the date. The Figma read skips them now, and I won't edit Figma to match. If I ever need Figma again for one component, `--unfreeze` is there, on purpose.

On 2026-10-23 I edited Figma for the first time since the freeze, through Figma's own write connector, to bring it in line with Rost:

- Projects' hovered details were stuck on #d3d9d5 although their variable says #ededed. They're rebound, and the test passes.
- Testimonials' sample quote is "This is where the testimonial goes", so the test compares it again.
- Thumbs' sample client is "Client", so `baseline/thumbs/` is public now and nothing is masked.
- The Button set (20:14) is just "button". The label-only set had already gone.
- Hero Media is a component in the portfolio file (793:2345): 1440 by 630, the 16px frame, the 24px corners, both surfaces bound to the kit's variables, and two empty slots, `media` and `content`.
- TestimonialPicture is one 56px component with an image slot (438:72). The old set of eight real people's photos is deleted, so `baseline/testimonials-pics/` is public too.

Still open from Figma:

- The Menu effect's blur. I took 12px from the nav, not from the "Menu" style, so that contract is still a draft.
- A few values have no token and no reason yet. They're at the bottom of [Token coverage](TOKENS.md).

## Done: a real website

On 2026-10-20 rost.build became a proper site, the way shadcn's is: a homepage, a page per component, tokens, icons, and these docs. It's built with Astro from `web/`, straight from the contracts, so it can't drift from them. Every component card on it is a Thumbs, with a glimpse of the component inside. Components that are in code show up live on their cards and pages, with a Code tab. The rest say "Not in code yet" on their card, and their pages show Figma's own renders until they're built. Button has none to show (its renders came back empty), and TestimonialPicture's stay private.

## Now: Rost in code

Twenty-one components so far, all built from their contracts and checked against Figma in the visual test:

- **InlineBanner**, all 8 variants, with Figma's own icons.
- **Badge**, all 8 variants. Figma gave it a small size since August: just the coloured dot. The dot in front of the label on the medium size is optional now.
- **Thumbs**, all 6 states. It's the first one with hover, pressed and focus, so the visual test now forces those through Chrome's DevTools protocol. The "Coming soon" pill on a disabled card is the Badge.
- **Divider, Tag, Chip, Button, IconButton, Toggle.** 61 variants, all matching. Chip Pressed was the last one over the line (2.62% against 2.5%). Chrome spreads a border on a fully round box over two pixels at each end, where Figma draws one, and Pressed is the state where the outline is solid. Since 2026-10-27 Chip draws its edge as an inset shadow, like Button and Toggle, and Pressed is at 0.68%.
- **Carousel, Projects, Testimonials, Menu.** 26 variants, all matching. Testimonials is a disclosure: its header is the button, so the contract says which part its focus and disabled states come from (`stateSelectors`).
- **Button** is PillButton's set with the icon made optional. Figma has the same button twice (20:14 with an icon slot, 39:38 without), so on 2026-10-23 I made them one.
- **Input**, all 14 variants. A press anywhere in the field puts the caret in it, since the empty input is 0px tall under its label. The clear button is Rost's IconButton.
- **TestimonialPicture.** The photo is a slot, in code and in Figma. The test compares the empty 56px frame, and the site shows landscapes.
- **Tabs and its TabItem**, designed in Figma on 2026-10-23 with their own `tabs/*` tokens: a label, optional icons before and after, and a green underline on the selected tab. All 11 variants match, and rost.build's Preview and Code tabs use them. They're one page on rost.build: a contract can say it's `partOf` another, and then it's shown under that one instead of on its own. The visual test now rounds every component inside another up to whole pixels, the way Figma does, so a bar of tabs is as wide as Figma's.
- **Tooltip**, from the UI Kit's own (138:276). Rost draws the bubble; the page decides where and when it shows. rost.build's nav uses it to say "You're already here" on the current page, which now wears Button's pressed look (`aria-current="page"`) instead of looking disabled.
- **ListItem**, all 10 variants, from the UI Kit's list page (346:3364). It brought Figma's `interactive/*` colours into Rost: `active` for the picked row, `inactive` for the rest. On a picked row Figma switches the status dot to the light theme, so the dot is its own part here. Since 2026-10-26 the dot can carry a status too (`badgeStatus`), in Badge's own colours. rost.build's sidebar is built from ListItems: a row gets a dot only when its component needs looking at, red when a variant fails the visual test and amber when it's not in code, its contract is a draft or its guidance isn't signed off. Hovering the dot says which. The visual test writes what failed to `baseline/results.json` for that.
- **Hero Media**, with two slots: the artwork behind and what sits on top. The artwork pins itself, as on the portfolio site. Its frame matches Figma's component exactly.
- **Navigation**, both variants, from the UI Kit's navigation page (356:949): a side nav on frosted glass, collapsed to icons or open with labels, made of ListItems and an IconButton or Button. ListItem learned an icon-only form for it, and the conformance check now names camelCase props the way the CSS does.

The effects are in code too, as tokens: Thumb, Menu, Lock frame and Floating each show on the site applied to real components. The Paper effect isn't. It's a canvas animation that lives in the portfolio site, and only its numbers are tokens.

Building them turned up four things to fix:

- **The parser took the wrong branch.** Where Figma guards a layer per state, it kept Default's values for every state. Toggle's off side said hover, pressed and disabled all look like Default. The pixels and the raw read say otherwise, so I fixed Toggle by hand. Projects and Menu had the same problem, and Carousel had lost its description line. Each one now reads its values from its own branch of the Figma read. Input had it too: read again on 2026-10-23, every variant now comes from its own branch.
- **Some Figma reads were never reads.** Carousel's Default came back as a Code Connect prompt and was saved as if it were code. Its values came from the other states' reads, which all carry Default's branch. Input's icons were never saved before their links expired. They're saved now.
- **ListItem's selected label was the wrong weight, and the parser had a bug.** On 2026-10-27 I read all 148 component variants again, node by node with `get_design_context`, and compared every value with what its contract resolves to. Where the read and the contract disagreed on a token, `get_variable_defs` on that node settled it. Two contracts were wrong. ListItem's selected label is paragraph medium, not regular. Input's label, while it sits large in an empty field, uses the paragraph weight token (also 400). ListItem, Navigation, Tabs, TabItem and Tooltip had never been read this way before. The reason the rest needed checking: `bin/parse.mjs` kept `selected=False` from the variant name as the string "False", which is truthy, so every off variant read the on branch. Toggle, Input, Testimonials, ListItem and Navigation all have a boolean axis. Their contracts had been put right by hand, but nothing caught it. The visual test didn't either: 400 against 500 at 14px stays under its line.
- **Figma's code and Figma's render disagree, twice.** Menu's description renders at 14px in four states while the code says 16px, and Projects' hovered details render #d3d9d5 while the code says #ededed. Both look like variable modes on those frames. I followed the render for Menu, where it matches a token exactly. For Projects Hover I kept #ededed, the same as Thumbs and Carousel. The frame turned out to hold a stale copy of the colour, and on 2026-10-23 I rebound it in Figma; it matches now.
- **Text sat about a pixel higher in Chrome than in Figma.** General Sans' metrics (ascent 1010, descent 240, line gap 100) get split differently. Since 2026-10-23 Rost ships its own `@font-face` (`tokens/fonts.css`) with `ascent-override: 106%` and `descent-override: 28%`, measured across every built component. The share of pixels that differ from Figma halved, and the accounting app and the portfolio site use the same three lines.

Next:

- **The portfolio site onto Rost's components**, with `npm run add`. It copies a component, what it imports, its contract and the check into an app, the way shadcn does, and updates them on a second run. The accounting app uses it for Badge, InlineBanner, Divider and Button since 2026-10-22. The portfolio site uses Rost's tokens everywhere now, but none of its components yet. A real `npx rost add` waits until Rost is published to npm.

## Now: make the contracts something I can trust

1. **~~Go through the accounting app's conformance findings.~~** Done by 2026-10-26: The accounting app's contract test passes for Badge, Button, Divider, InlineBanner and Toggle with no findings left, and what it does differently is written down as deviations. On 2026-10-26 I moved all five to `stable`. What it was, against the YAML contracts on 2026-10-19: Badge 0, InlineBanner 10, Input 15, Toggle 36, PillButton (Button now) 47. I know two of the causes:
   - **Real drift.** The primary PillButton (Button now) has no 1px top and left edge (`border-top-width: spacing/outline/small`, `border-color: actions/primary/*/outline`). Only the secondary one shipped. The contracts couldn't show it until the parser stopped dropping `border-t` and rgba borders.
   - **A limit of the check.** the accounting app draws the selected Toggle's edge on `::before`, and the check only reads the root selector. `implementations.*.parts` needs a way to point a root property at a pseudo-element.

   *Done when* every finding left is either fixed or written down as a deviation. Each component that gets to zero can go stable.
2. **~~Export every Figma variable.~~** Done on 2026-10-26. Until then I added variables by hand when a contract needed one, and three times a colour got called "no token" when Figma had one. Now I've read the variables from Figma one last time, all 661 of them with both theme modes, into `registry/figma-variables.json`. `npm run tokens` (`bin/build-tokens.mjs`) builds `tokens.css` and `tokens.json` from that read, keyed on the Figma names, so `non-interactive` keeps its hyphen. The colour primitives, the whole typography scale and the spacing primitives are in. Every token that was there kept its name and value, with one exception: `--spacing-base-8` was 8px in code and is 16px in Figma, so it's 16px now. `--effect-lock-frame` is a plain `blur(8px)` instead, which is what it was before (Figma's blur radius is twice CSS's, which is where the 8 came from). Rost's own tokens (the effects, the shadow, the hero height and two old names) are listed in the script. `npm run validate` fails when `tokens/` is out of date. Still open: `tokens.json` has the light theme's values, but `tokens.css` is dark only. The read doesn't make Figma the source again.
3. **~~One list of components.~~** Done on 2026-10-26. `registry/component-sets.json` holds each set and its variants, and `variant-nodes.json` is gone.
4. **~~Variants as layers.~~** Done on 2026-10-26. A variant list used to repeat what one axis decides: Toggle's unselected background showed up five times, once per state. Now a `when` can leave axes out. `when: { selected: false }` says it once, `when: { state: Disabled }` goes on top, and the most specific entry wins ([how it's read](CONTRACT.md#variants-as-layers)). The CSS build, the check, validation and the site all apply layers through the same function. Toggle, Button, Badge, IconButton, InlineBanner and Testimonials are written in layers now, 415 lines shorter between them, and the CSS they generate is the same as before: the same rules in the same order, only the declarations inside a rule can come out in another order. Input and ListItem would only lose a few lines each, so I left them. Two things are left. The accounting app's test loops over `yaml.variants`, so once its copies come from these files it'll also run a test for each layer, which only checks the fixed values. It should loop over `forApp`'s variants instead. And the Figma read still writes variants out in full, which matters only if I ever unfreeze a contract.
5. **~~One copy of the contracts.~~** Done on 2026-10-26. `npm run add` copies each contract's YAML into the app as it is, and the accounting app's test parses that, so there are no JSON copies left to drift. The app still has a copy, but it's the same file, and the next `add` replaces it. All 52 tests pass.
6. **Guidance for the new components.** Every contract's guidance is signed off now. ListItem, Navigation, Tabs, TabItem and Tooltip were the last, on 2026-10-26, once they covered element, name, keyboard and focus. They can go stable as soon as an app uses them. TestimonialPicture has proposed guidance since 2026-10-27, waiting for me. While I'm at it, decide on the four deviations nobody has taken back to the design side yet (the Health section lists them).

## Next: grow the kit

In order of how much copied code each one removes.

| Component | Why now | Where it stands |
|---|---|---|
| **Icons** as a component | The 17 SVGs are exported (`assets/icons/`), but there's no `Icon` component yet, and the apps draw their own | SVGs exported, component next |
| **~~ListRow~~ Table** | The accounting app builds it outside the kit | ListRow became Table on 2026-10-30. ListItem didn't cover it: a row there leads with a Badge, ends with an amount and can carry a second Badge. Those rows are a table, so Rost has Table, TableRow and TableItem as drafts, with `leading` and `trailing` slots. Next: move the accounting app's payment schedule onto them |
| **Switch, Textarea, a selected Chip** | The guidance already says they're missing | need designing first |

~~Move the portfolio site onto the kit's token names.~~ Done on 2026-10-26: its raw hex count is 0, like the accounting app's.

## Later

Ideas from a workshop board I sat in on, shrunk down to a personal kit with two apps. I skipped the team-process ones.

| The idea | What it means here |
|---|---|
| Spec templates for every kind of issue | The template contract and `npm run validate` are there. Add GitHub issue templates for *new component*, *deviation* and *token change* |
| One place for docs, docs in markdown, a docs skill | Partly done: `docs/components/*.md` is markdown an agent can read. Next, a Claude skill that loads the right page before building a component in either app |
| Motion in the contract | There are no motion tokens, so the portfolio site eases Projects' and Testimonials' 16px slide itself (0.2s, ease-out), each recorded as a deviation. Two components doing the same thing is the point to make it a token and put it in the contracts |
| A better changelog | Started on 2026-10-27: [release notes](CHANGELOG.md), written by hand at every merge and deploy. Next, build the contract part of it from what changed in the contracts ("Badge: outline token went from X to Y"), not from commit messages |
| Spec-driven work, PR checks | Both apps run the strict audit in CI. Since 2026-10-26 Rost has its own (`.github/workflows/check.yml`): the contracts validate, the docs and the generated CSS match them, the site builds. The visual test isn't in it yet, because Linux draws text differently from the Mac the baselines were made on |
| Designers working in code | The "Adding a component" steps in [CONTRACT.md](CONTRACT.md), down to one command each |
| Charts | The accounting app will need them. Tokens for data-viz colours and a Chart contract come before any chart |
| Device-specific work | Breakpoint and density tokens. There are none yet |
| Measuring it | Track the audit table at the top over time, so adoption is a number and not a feeling |
