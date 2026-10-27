# Release notes

What changed each time I merged into `master` and put rost.build live. Newest first. The commits have the details; this is what it means for a component or an app.

## 2026-10-27

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

- The accounting app's contract test passes (52). If it takes ListItem or Input with `npm run add`, it gets the label fixes.
- Not done yet: the Figma reader still mixes up two unnamed text lines in one part (Testimonials' title and the job under it) and misreads a few conditions in Tags, IconButton and Thumbs. I checked those against each node by hand this time.
