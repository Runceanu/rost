# Release notes

What changed each time I merged into `master` and put rost.build live. Newest first. The commits have the details; this is what it means for a component or an app.

## 2026-10-30

- **Less grey on rost.build.** Tables sit on the page now: no box, no outline, no grey fill, labels in the text colour, only a hairline between rows. Cards and icon tiles lost their outlines too.
- **Guidance is drawn, not listed.** On a component page "When to use" and "When not to use" are cards, and when a "not for" points at another component (`**IconButton**`), that component shows live in the card with a link to it. Accessibility is a card per concern. The words are the contract's own.
- **Projects' names line up whatever the number.** In General Sans a "1" is narrower than a "0", and the font has no tabular figures, so a row numbered "01" started its name about 3px left of the rest. The number is at least `2ch` wide now, the width of Figma's "00" in its own font, so every name starts in the same place. All six Figma states still match.
- **Component pages are easier to read.** On rost.build:
  - A **Contract** tab sits next to Preview and Code, with the whole YAML the page is built from.
  - **Where it's used** is a card per app: whether it runs Rost's own copy or its own version, the file and class, and that app's deviations in the card. What's left under the old heading is what Rost does differently from Figma everywhere, so it's called that now.
  - **Never changes** is a card per part. Values with a token are rows; plain layout (display, position, flex) folds into one quiet line under them.
  - **Changes by variant** is spec tables now, not a list of properties to open one by one. For each property the page works out what the value actually follows (state, type, size), and draws one table per group with a column per state. A token path every cell shares is written once, under the property, and Primary's `box-shadow` shows only the outline token that changes. Values that never change and are only set in some variants are listed by where they're set: "Focus", "All but Borderless".
- **The token page draws its tokens.** Colours are swatches, spaces and sizes are bars, smallest first, and radii, outlines, opacity, type sizes and weights, blurs and the shadow each get a picture. A row of links at the top jumps to each group.
- **One heading style, one caption format.** Every `h2` on rost.build is the section title, 40/48 (`typography/sub-headline`), on the home page, the component pages and the docs alike; the guidance headings and the docs had their own. Preview captions read the same everywhere: each value with a capital, joined by " · ", "Not selected" for an off boolean, and "Default" for a component with one fixture.
- **The apps aren't named anywhere public.** The docs, the contracts, the site and the code call them the accounting app and the portfolio site, with `accounting-app` and `portfolio-site` as their keys. The token alias file has a neutral name too, `tokens/portfolio-aliases.json`.
- **The Paper effect shows itself.** It's been in code all along (`src/effects/paper.ts`), but with no preview the site said "Not in code yet". Its card and page draw the sheet live now; move the pointer over it.
- **The roadmap's Next table is current.** Hero Media is in the portfolio site already, so that row is gone, and ListRow is checked: ListItem doesn't cover the accounting app's rows, so it needs designing.
- **ToggleGroup.** A row of Toggles where one is chosen, like the accounting app's year switcher. Tab lands on the chosen toggle and the next Tab leaves, arrow keys move the choice and skip disabled ones, and Home and End go to the first and last. Toggle's guidance promised this and nothing did it; now Rost does, and the accounting app's year switcher uses it, so its own group and the deviation that went with it are gone. It started in code, so it's a draft with proposed guidance until there's a Figma frame.
- **Button's default type is Primary,** as the code always had it. Figma's set lists Borderless first, and the contract had copied that.
- **Contracts say what the code does.** From the review of every component:
  - Tooltip's 20px height is `spacing/size/xsmall` now, not "no token". It still matches Figma.
  - IconButton and Toggle list their `icon` slot.
  - Button and IconButton note that React calls `type` `variant`; Projects and Thumbs note `showKind`.
  - Button's guidance says the whole button fades when disabled, label and all.
  - IconButton's guidance says why Project is 32px when the others keep a 40px floor.
  - Thumbs' focus ring is 4px out, as drawn. The Thumb effect lists Navigation, which uses it, and the Lock frame effect no longer says `spacing/base-8` is missing.
- **The accounting app is on current Rost.** Every copy is up to date (the disabled-hover fix and variants as layers came with them), its tokens are Rost's whole file (its old copy had `spacing/base-8` at 8px, not 16), and its contract test checks every whole variant, 289 tests in all. Its text fields are Rost's Input now, so the label, the value, the help line and the focus ring match the contract, and the help line is tied to the field for screen readers. A mismatched passphrase marks the Confirm field, not the first one.
- **The accounting app's signed-in screens, checked on a phone.** I walked setup, the dashboard and the past years with a throwaway vault and invented statements. Four things widened or broke the page on a phone, and they're fixed: the setup questions used whole sentences as field labels (each question is text above its field now, with a short label in it), a sentence-long InlineBanner ran off the screen (it wraps now, recorded as a deviation), an amount broke its minus sign onto its own line, and a badge sat over its date. The setup steps' numbers fit their circles too.
- **Input says how much room its help line needs.** It hangs below the 56px field, so a layout leaves 16px under a field that has one. The accounting app's lock screen ran the line into the next field before.

## 2026-10-29

- **How a contract works is drawn, not only written.** On rost.build the page opens with Rost's numbers as they are today (contracts, components, tokens, variants matching Figma, apps), counted from the contracts at build time. What a contract gives an agent reads as cards, the way from Figma to code as a diagram, and the statuses as a track with how many contracts sit at each. The words are still only in `docs/CONTRACT.md`, which reads the same as before on GitHub.
- **The docs say why, once.** [How a contract works](CONTRACT.md) opens with why Rost uses contracts and not just tokens, which used to sit in the README, and what a contract gives an agent that builds UI: named tokens, when not to use a component, the accessibility to follow, and a check it can run. The README is shorter and only points the way. Stale bits went: old counts, the accounting app's old file paths in the example, and a note that the accounting app didn't run the check.

## 2026-10-27

**In the evening**

- **Carousel can be a button, and the card that's showing wears Pressed.** `aria-current="step"` gets the Pressed look, the way `aria-current="page"` does for Button, and `as="button"` is for a card that switches something on the page instead of going somewhere. The root drops the browser's own button look. Figma's five variants still match.
- **The portfolio site follows Rost.** Rost is the source of truth, so where the site differed, the site changed:
  - Projects and Thumbs keep Rost's type at every width (40/48 and 24/32). They used to shrink on a phone; now a long name wraps.
  - The nav is Rost's Button (Tertiary, Secondary) and Tooltip, like rost.build's header. Under 420px it drops Book an intro, which every page has in its body.
  - The case-study steps are Rost's Carousel; the hand-built CarouselCard is gone. Their descriptions are `typography/paragraph` now.
  - Roche's disclaimer is Rost's InlineBanner (Warning, Medium), with Rost's warning glyph.
  - The app's tokens are Rost's `tokens.css`, whole. Its old partial copy had 308 of 670 tokens and the wrong `spacing/base-8`. One rule read a token that didn't exist (`--gap-7xlarge`); it reads `--spacing-gap-7xlarge` now.
  - 59 raw `rgba()` colours are Rost colour tokens at Rost opacity tokens. 25 of them weren't on the opacity scale and moved to the nearest step, most by 0.04 or less.
  - The app's copies are all on current Rost, and its contract test checks every whole variant (116), not the raw layers.
  - What's left different is recorded on Projects, Thumbs, Button and InlineBanner, and Carousel and Tooltip list the portfolio site as an app that uses them.

**Later the same day**

- **Chip matches Figma in every state.** Pressed was the one variant of 149 over the visual test's line (2.62% against 2.5%). The contract was right; Chrome draws a 1px border on a fully round box over two pixels at each end, where Figma draws one, and Pressed is the state where the outline is solid. Chip draws its edge as an inset shadow now, like Button and Toggle. Pressed is at 0.68%. The portfolio site has its own copy of Chip and gets this with `npm run add`.
- **TestimonialPicture has guidance.** It's proposed, not agreed: when to use it (a Testimonials row), when not (an avatar anywhere else, a logo), and how to write its `alt`. It was the only contract with none.
- **The tables under "Changes by variant" line up.** Every group on a component page uses the same columns, so values and tokens sit in one line from group to group. A long variant name or value wraps instead of pushing the token off the side, and on a phone each row stacks.

**Fixed**

- **ListItem.** A selected item's label is paragraph medium (500) now, as Figma draws it, in every state. It was regular (400).
- **Input.** While the label sits large in an empty field, its weight uses the paragraph token, the way Figma does. It's 400 either way, so nothing looks different.
- **Disabled items ignore hover and press.** A disabled button no longer takes the hover fill. The hover and pressed rules skip a disabled item (`:where(:not(…))`), and `src/conform.ts` accepts that form.
- **`bin/parse.mjs` read every off variant as on.** It kept `selected=False` from the variant name as the text "False", which is truthy, so `!selected` was never true. Toggle, Input, Testimonials, ListItem and Navigation all have an axis like that. Their contracts had been put right by hand. The next read of Figma would have brought the mistake back.

**New**

- **Variants as layers.** A `when` can leave axes out: `when: { selected: false }` says once what every off variant shares, and the most specific entry wins. Toggle, Button, Badge, IconButton, InlineBanner, Testimonials, Input and ListItem use layers. Their CSS didn't change. [How it's read](CONTRACT.md#variants-as-layers).
- **Every component read from Figma again, node by node.** All 148 variants, compared value by value with their contracts. ListItem and Input above are what it found. ListItem, Navigation, Tabs, TabItem and Tooltip had never been read this way before.
- **Release notes.** This page. I add to it every time I merge and deploy.

**On rost.build**

- Component pages: spaces in "Where it's used" and the deviations, markdown inside deviations, no sideways scroll on a phone, token colours back.
- TestimonialPicture and Hero Media show a filled preview. The visual test still compares Figma's empty frames.
- Doc headings have ids, so a link to `#a-heading` lands on it, below the sticky header.
- Hidden previews and code cards are out of the tab order.

**For apps**

- **The portfolio site's Testimonials slide smoothly again.** The rows lost their motion on 2026-10-26, when the site moved to Rost's Testimonials, which has none. The 16px slide on hover, press and opening is eased over 0.2s now, the same as the Work list's projects. Motion isn't in the contract yet, so it's the site's own, recorded as a deviation.
- The accounting app's contract test passes (52). If it takes ListItem or Input with `npm run add`, it gets the label fixes.
- Not done yet: the Figma reader still mixes up two unnamed text lines in one part (Testimonials' title and the job under it) and misreads a few conditions in Tags, IconButton and Thumbs. I checked those against each node by hand this time.
