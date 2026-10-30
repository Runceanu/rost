# Release notes

What changed each time I merged into `master` and put rost.build live. Newest first. The commits have the details; this is what it means for a component or an app.

## 2026-10-30

- **Dark is the default, whatever your system says.** Light comes only from `data-theme="light"`. Until a few hours ago a system set to light got the light theme too; I took that out, so `tokens.css` has no `prefers-color-scheme` rule now. rost.build is dark until you use the switch. Apps can update without setting `data-theme` at all.
- **Table, TableRow and TableItem.** The accounting app's payment rows, which I called ListRow, are really a table: a date, what it's for and an amount, read across. So Rost has one now. `Table` is a real `<table>` with an optional caption and no box. `TableRow` draws a hairline under itself and can be a link (`href`) or something you pick (`onSelect`); a `<tr>` can't be either, so the row's header cell holds the link or button and stretches it over the whole row. `TableItem` is the cell, with `leading` and `trailing` slots for a Badge or an icon, a description line, and `numeric` for amounts, which sit on the right and never break. Only existing tokens. They started in code, and I drew them in Figma after, next to ListItem on the list page, from the same variables, text styles and Badge. TableItem has `leading` and `trailing` slots, TableRow an `items` slot for its cells, and Table a `rows` slot, the way Tabs holds its tab items. All 15 Figma variants match the code in the visual test. To get there the test no longer rounds a table's rows and cells to whole pixels: a row owns half of each hairline between rows, so it's 52.5px, and rounding it up grew the table. All three are drafts with proposed guidance, and the accounting app doesn't use them yet.
- **Four things drafted in code, then drawn in Figma.** Each is built from tokens Rost already has, and each is still a proposal: the new contracts are drafts with proposed guidance, and the new parts of Chip and Menu say so in their notes. After the code, I drew them in the UI kit too, bound to the kit's variables, and every new variant matches its Figma frame. Chip's and Menu's old states match as before.
  - **In Figma:** the selected chips are a second column in the Chip set (a new `selected` property), Current is a sixth row in the Menu set, Switch sits next to Toggle, and Textarea next to Input. ToggleGroup is drawn under Toggle as a component with a `toggles` slot, the way Tabs holds its tab-items. Figma's Toggle has no label, so its group shows three icon toggles, and that's what the test compares. Their contracts point at Figma now, and `registry/component-sets.json` lists them.
  - **Chip has a selected look.** `selected` gives the chip that's on a solid green plate with a dark label and no edge: a selected ListItem's look, with the same `interactive/active` tokens. It sets `aria-pressed` for you. Leave it out on a chip that only does something, and there's no `aria-pressed` at all.
  - **Switch.** A new component for a setting that's on or off and works straight away. A `<button role="switch">` with `aria-checked`: a 40 by 24 track, a 16px thumb that moves across, and the label beside it as its name. Off is faded like an off Toggle, on is primary green. Space and Enter flip it, the focus ring goes round the track, and disabled fades it all. The thumb jumps for now; once there are motion tokens it should slide.
  - **Textarea.** Input grown down, with Input's tokens for the fill, the edge, the label, the help line, the error and the focus ring. One difference: the label always sits small at the top, because in a box three lines tall it would float alone in the middle. Input's guidance points to it now.
  - **Menu marks the page you're on.** `aria-current="page"` gives it a sixth state, `Current`: the description bright and medium, as when you press it, and the divider as bright as the text. Button's nav does the same with its pressed look. Menu keeps the resting size, though, since its Pressed grows the description and the current row would come out taller than the others.
- **A light theme.** Every colour token has a light value now, under the same name. `tokens.css` keeps dark on `:root` and adds light under `[data-theme="light"]`, or under the system's light setting when nothing sets a theme. `[data-theme="dark"]` brings dark back inside a light page. The values start from Figma's own light mode. Where that failed contrast, mostly the bright green used as text or an icon on white (1.9:1), `registry/light.json` picks a darker step of the same family. The bright green stays for fills. Components needed no changes, and every one still matches Figma in dark.
- **Apps: set `data-theme="dark"` before you update.** Without it, a visitor whose system is light gets the light theme, and neither app has been looked at in light yet.
- **A contrast check that measures what's drawn.** `node bin/contrast.mjs` renders every fixture in both themes, forces hover, pressed and focus, and measures every piece of text and every icon against the pixels behind it. Nothing fails in light that passes in dark, except Thumbs: its frosted panel is `base/black`, so it stays dark while its text goes dark. That needs a contract change, and [Token coverage](TOKENS.md#two-themes) lists it with the other things still wrong.
- **rost.build has a light and dark switch** in the header. It remembers your pick, and follows your system until you make one. The token page's swatches show the theme you're in, with both values under each.
- **Illustrations stay as they are.** They're drawn for a dark ground. In light their dark greys turn into heavy blots. They need light versions drawn, not recoloured in code.
- **Both are in Figma.** The UI Kit's light mode has Rost's 89 corrected values now, as aliases to the same primitives, and Dark is still the default mode. The ten motion values are Figma variables too: durations as numbers in milliseconds, easings as strings. I read every variable back out afterwards and the tokens came out identical, so `registry/figma-variables.json` is that new read. In Figma, Borderless's hover and pressed fill turns out to be a square with no radius, which only shows in light.
- **Motion tokens.** Four durations (`motion/duration/fast`, `base`, `slow`, `slower`: 150, 200, 450 and 600ms) and six easings, from what the portfolio site and rost.build already used. rost.build's transitions use them, and the Projects and Testimonials contracts name them for the row slide. The token page draws each one: hover a row and a dot crosses with that timing.

- **Icon and Illustration are components now.** The 18 icons and 24 illustrations were files in `assets/` and nothing more. Each is a Rost component with a contract: `<Icon name="arrow-right" />` draws the glyph as a mask in the text colour, at 24px or the 20px and 16px slots Button and IconButton use, and `<Illustration name="timezones" />` draws a 72px drawing in its own colours. Both are hidden from screen readers unless you give them a `label`. Every one matches its Figma frame pixel for pixel. `circle-outline` has no frame in Figma's set yet.
- **The Icons page shows how to use each one.** Pick an icon or a drawing and the page shows it large, the React line, the HTML and CSS without React, the SVG itself, and links to its Figma frame and file.
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
