# Accessibility

Where Rost's components stand against WCAG 2.1 AA, in both themes. Reviewed on 2026-10-30. Two scripts do the measuring, and anyone can run them again:

- `node bin/contrast.mjs` measures every piece of text and every icon in every fixture against the pixels behind it (1.4.3, and icons for 1.4.11).
- `node bin/a11y.mjs` runs axe-core's WCAG 2.0 and 2.1 A and AA rules on every fixture, tabs to every control to check that focus shows and is strong enough (2.4.7, 1.4.11), and measures the edge of every field, switch and toggle against the page (1.4.11).

Disabled states are left out, as WCAG leaves them out. Hover, pressed and focus are forced the way the visual test does it.

## What passes

- **axe finds nothing,** in either theme: every control has a name, a role and its state (`aria-pressed`, `aria-checked`, `aria-current`), fields have labels, and nothing uses ARIA wrong.
- **Every control can be reached with Tab and shows focus.** The ring is 2px, sits outside the control, and is 3:1 or more against the page in both themes.
- **Text at rest passes,** in both themes, everywhere except the places below. Most of what fails is hover, pressed or an error state.

## What fails

Each of these comes from a token value, so the fix is a token, in Figma and in code. Most of the dark ones are Figma's values from before light existed.

**Edges of controls (1.4.11, needs 3:1 against the page)**

| What | Dark | Light |
|---|---|---|
| Input and Textarea edge, `input/regular/default/outline` | 2.72 (`#555555`) | 1.71 (`#c2c7c3`) |
| Input and Textarea edge with an error | passes | 2.84 |
| Switch and Toggle when off, the track `actions/secondary/regular/default/background` | 1.86 | 1.00 (it's the page colour) |
| Switch when on, and a selected Chip: the bright green on white | passes | 1.92 |

**Text and icons (1.4.3 needs 4.5 for text, 1.4.11 needs 3 for icons)**

| What | Dark | Light |
|---|---|---|
| Error text and icons in Input and Textarea, `#ae1b13` on the dark field | 2.56 to 2.81 | passes |
| Error label on hover | 4.24 | passes |
| `#3a3a3a` on the pressed green: Primary IconButton's icon, Toggle's glyph, a selected ListItem's description | 2.80 | passes |
| A selected ListItem's description on hover | 4.23 | passes |
| Tag's label on hover and pressed | 3.90 and 1.96 | passes |
| TableItem's description on a hovered, pressed or selected row (`non-interactive/foreground/tertiary`) | 2.26 to 3.99 | 3.25 to 4.01 |
| Textarea's text on hover with an error | 2.43 | 3.99 |
| Thumbs' details on the frosted panel, `project/*/sub-label` | passes | 4.29 |

**Not measured**

- Badge's dots and InlineBanner's icons are SVG files with their colour in them. They don't follow the theme. Next to their label they read, but the bright green and orange are under 3:1 on InlineBanner's light grey.
- The check flags a Tertiary IconButton's focus in light: 78 of the pixels round it reach 3:1. Its ring is `#747573` on `#fcfcfc`, 4.6:1, so I count it as passing. A thin round ring gets antialiased, and the check counts pixels.
- Target size (2.5.5) is AAA in WCAG 2.1, so it isn't here.

## What's next

Fixing these means changing token values, which changes how the controls look: a field edge you can see in light, a darker Switch track, a darker error red in dark. I want to decide those together rather than one at a time, and put them into Figma at the same moment. Until then, this page is the list.
