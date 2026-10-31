# Accessibility

Where Rost's components stand against WCAG 2.1 AA, in both themes. Every built component passes, as of 2026-10-31. Two scripts do the measuring, and anyone can run them again:

- `node bin/contrast.mjs` measures every piece of text and every icon in every fixture against the pixels behind it (1.4.3, and icons for 1.4.11).
- `node bin/a11y.mjs` runs axe-core's WCAG 2.0 and 2.1 A and AA rules on every fixture, tabs to every control to check that focus shows and is strong enough (2.4.7, 1.4.11), and measures what marks a control against the page: a field's edge, a switch's track, a selected chip or toggle (1.4.11).

Disabled states are left out, as WCAG leaves them out. Hover, pressed and focus are forced the way the visual test does it.

## What passes

- **axe finds nothing,** in either theme. Every control has a name, a role and its state (`aria-pressed`, `aria-checked`, `aria-current`), fields have labels, and nothing uses ARIA wrong.
- **Every control can be reached with Tab and shows focus.** The ring is 2px, sits outside the control, and is 3:1 or more against the page.
- **All 431 pieces of text and icons pass,** in both themes, at rest, on hover, pressed and focused.
- **Every field, switch and selected thing can be told apart from the page** at 3:1.

## What I changed to get there

The first review, on 2026-10-30, found 23 failures in dark and 20 in light. Most were token values from Figma's dark mode, from before there was a light one. On 2026-10-31 I changed 21 values, in Figma's variables and in `registry/figma-variables.json` at the same time, and redrew four components. Every Figma variant still matches its code.

**Tokens**

| Token | Mode | Was | Is | Why |
|---|---|---|---|---|
| `input/regular/default/outline`, `focus/outline` | dark | neutral/400 `#555555` | neutral/500 `#747573` | A field's edge, 2.7:1 on the page. Now 4.3. |
| same | light | neutral/400 `#c2c7c3` | neutral/600 `#747573` | 1.7:1. Now 4.5. |
| `input/regular/hover/outline` | light | neutral/300 | neutral/600 | 1.2:1 on the hover fill. |
| `input/negative/default/outline`, `focus/outline` | light | negative/400 | negative/500 | An error edge at 2.8:1. Now 4.2. |
| `input/negative/hover/icon`, `hover/supportive` | dark | negative/400 `#ae1b13` | negative/500 `#e93120` | The error red was 2.6:1 on the dark field. |
| `input/negative/hover/label` | dark | negative/500 | negative/600 | 4.2:1 on the hover fill. |
| `input/negative/hover/placeholder` | dark, light | neutral/400, neutral/600 | neutral/600, neutral/700 | 2.4 and 4.0:1. |
| `actions/primary/pressed/icon`, `pressed/sub-label` | dark | neutral/300 `#3a3a3a` | neutral/100 `#060805` | Grey on the pressed green, 2.8:1. Now 4.9, the same dark as the label. |
| `interactive/active/hover/sub-label`, `pressed/sub-label` | dark | neutral/300 | neutral/100 | A selected ListItem's description, 2.8 and 4.2:1. |
| `actions/secondary/regular/hover/background` | dark | neutral/500 | neutral/400 | Tag's hover label was 3.9:1 on it. |
| `actions/secondary/regular/pressed/background` | dark | neutral/600 `#999999` | neutral/250 `#282828` | Tag's pressed label was 2.0:1. Pressed sinks now instead of lightening. |
| `project/default/sub-label`, `focus/`, `lock/` | light | neutral/600 | neutral/700 `#454545` | Thumbs' details on the frosted panel, 4.3:1. |

**Components**

- **Switch.** The track's edge was part of its faded fill, so it was 1.9:1 in dark and gone in light. The edge belongs to the track now, at full strength: a field's edge when off, the positive green when on (the fill's own colour in dark, a dark green in light, where the bright fill is 1.9:1 on white).
- **Chip** and **Toggle**, when selected or on: a 1px ring in the positive green. In dark it's the plate's own colour, so it only shows on hover and press. In light it's dark green around the bright plate.
- **TableItem.** On a selected, hovered, pressed or focused row its description takes the label's colour, because the quiet grey is under 4.5:1 on those fills. A selected row's first cell has a 2px green bar down its left: the row's dark green fill is 2:1 against the page, and the bar is 10:1 in dark and 6:1 in light.

## Not measured, or not counted

- Navigation's logo is a picture with its own colours, so it isn't measured. Badge's dots and InlineBanner's glyphs used to be pictures too; since 2026-10-31 they're masks in the status colours (`non-interactive/foreground/<status>/base`), measured with the rest, and they pass.
- Illustrations are decoration, so the contrast check leaves them out. Their three colours follow the theme now; [Token coverage](TOKENS.md#illustrations) says how the light ones were picked.
- An off Toggle has no plate to speak of. Its glyph names it, the way a Tertiary IconButton's does, and the contrast check measures the glyph. What has to stand out is the on state, and it does.
- Where a control draws its own focus ring, the check reads that ring's colour against the page. Counting pixels wrongly failed the thin round ring on a Tertiary IconButton, at 4.6:1.
- Target size (2.5.5) is AAA in WCAG 2.1, so it isn't here.
- Neither app has been checked. This is the components on their own.
