# Rost in pen.dev

`design/rost.pen` is Rost as a pen.dev library: every token as a variable, in the dark theme and the light one, and every component variant as a reusable component. The apps' own design files import it, the way a Figma file uses a library.

It's built, not drawn. `npm run pen` renders each component's fixtures in Chromium (the same ones the visual test uses, with hover, press and focus forced), and turns what the browser draws into pen.dev frames, text and shapes. Every value the CSS takes from a token stays bound to that token, because Chrome says which `var(--...)` won for each property. So two tokens that both come out as `#3a3a3a` stay two tokens in the design too.

Don't edit `rost.pen` by hand. Change the contract or the component, then run `npm run pen` again. The code is the source; this file is a picture of it that designers can use.

## Using it in an app

In the app's own `.pen` file, next to its code:

```json
{ "version": "2.21", "imports": { "rost": "../rost/design/rost.pen" }, "children": [] }
```

Then the tokens are `$rost:<token>` (`$rost:actions-primary-default-background`) and the components are `rost:<id>`. A component's name says which variant it is: `Button/type=Secondary, state=Hover`. An instance can change its text and hide parts, like any pen.dev instance.

`npm run pen -- badge button` rebuilds only those components, which is quicker while you're checking one, but the file then holds only them. Run it without names before committing.

pen.dev reads the library when it opens the app's file. After `npm run pen`, close the app's file and open it again to see the new version.

## What's different from code

- **The font.** pen.dev only draws Google fonts, and Rost uses General Sans. The variable still says General Sans Variable, so anything built from the file is right, but pen.dev shows a fallback, and text runs a little wider or narrower than it will.
- **Sizes are numbers.** pen.dev drops a variable on a width or a height, so a 48px button is 48, not `spacing/size/medium-large`. Each frame that had a size token says which one in its context. Padding, gaps, radii, colours, strokes and type keep their tokens.
- **Opacity is a percentage.** pen.dev reads an opacity variable as a percentage, so `opacity-gentle` is 24 there, where code has 0.24. It draws the same.
- **No variant switcher.** pen.dev has no Figma-style variant axes. Each variant is its own component, named the way Figma named it.
- **A component inside another** (the Badge in a Thumb) is drawn in place, not as an instance of Badge.
- **Text sizes follow the browser.** A line that fits on one line in Chromium stays one line, and a frame keeps the width it had where pen.dev couldn't stretch it. With the fallback font some labels come out a little wider or narrower.
- **A full-size layer becomes the component's own paint.** Button's background and Chip's outline are separate layers in the code. Here they're the component's own fill and stroke, so the component grows with its label. Where that layer had its own opacity, the paint is a one-colour gradient, the only paint in pen.dev that takes one.
- **Not there yet:** the bevel highlight on a selected Toggle, and pictures in a slot (a testimonial's photo, a project's thumbnail). Icons and other SVGs come across as shapes; a PNG or JPEG doesn't yet.
- **No motion.** Transitions aren't in the contracts either.
