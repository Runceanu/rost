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

## An app's pages

`bin/build-pen-pages.mjs` does for an app's pages what `npm run pen` does for the components: it renders each page in Chromium, 1440 wide and whole, and writes a `.pen` file that imports the library, with every value the app takes from a token written as `$rost:<token>`.

```bash
node ../rost/bin/build-pen-pages.mjs <app> <built site> <out.pen> / /work /about
node bin/build-pen-pages.mjs web dist ../design/rost-build.pen --all
```

`--all` takes every page of a static site, from the `index.html` files in its build.

The portfolio site runs it as `npm run design`, which builds the site first and writes `design/portfolio.pen`, one frame per page. rost.build runs it as `npm run pen:site`, which writes `design/rost-build.pen`: all 46 pages, the home page, every component's page, the tokens, the icons and the docs. That file is about 30 MB and takes ten minutes to make, so it stays out of git like the images; run `npm run pen:site` to have it.

The accounting app is different: its screens aren't addresses, they're states behind a passphrase. For an app like that the site can be a running dev server, and the routes a module of steps, each of which leaves the page on one screen:

```js
export default [
  { name: 'Locked', fresh: true, run: async (page, origin) => { /* make a throwaway vault */ } },
  { name: '2026', run: async (page, origin) => { /* unlock it */ } },
]
```

`fresh` starts a step in a new browser profile, with nothing stored. The accounting app's steps, in `scripts/pen-screens.mjs`, make a vault with invented clients and figures through the app's own vault code, so no real document or number goes anywhere near the design. With `npm run dev` running, its `npm run design` writes `design/accounting.pen`: setting up, locked, and the 2026 and 2025 dashboards.

Pages need a few things components don't:

- **Margins and centring.** Flex can't say what a margin says. Where a gap that's the same between every child doesn't put the children where the browser put them, that frame places its children at their own positions instead. Rost's components use gaps, so they keep their flex layout.
- **Grids** become rows, each item as big as the grid made it. A grid that centres its items (a sign-in card in the middle of the page) places each one where it was. A one-line text that fills a grid cell sits in a frame as big as the cell, so it keeps its column without wrapping in the stand-in font.
- **Inline things in a block** (figures side by side, a badge after a title) run along a row.
- **Photos** are image fills that point at the app's own files: in `public/`, or the file in the repo that the build copied under a new name (rost.build's Figma renders come from `baseline/`). An image the build inlined as a `data:` URL is written out once, named by its bytes. An SVG picture (a project's preview, a client's logo) is drawn once as a PNG in `design/images/`, because pen.dev's image fills don't draw SVG. Those PNGs stay out of git (the portfolio site's came to 16 MB), so after a fresh clone run `npm run design` once, or the pictures show empty.
- **Code blocks** are one text with their lines and indents as they are. Their highlighting doesn't come across.
- **Something the page scales** (each component's preview in its card on rost.build) is a picture of itself, taken by Chromium, because pen.dev can't scale.
- **A sentence made of styled spans** (a headline with one bright phrase) is one text in the paragraph's colour. A pen.dev text has one fill, so the bright phrase loses its colour.
- **What moves doesn't come across:** canvas drawings, animations and video. A slideshow shows whichever slide was up.

### Instances

A Rost component on a page is an instance of the library's variant, so a change to Button in the library shows up on every page's buttons. The script picks the variant by four things:

- **Classes.** The root's own classes (`rost-button rost-button--type-secondary`). Each variant in `rost.pen` records its root's classes.
- **Parts.** The page's parts must be the variant's, in order. A part the page leaves out (a project row with no period) is switched off on the instance.
- **Size.** The page draws it at the variant's size, unless the variant hugs its content. A library variant is drawn at its fixture's size, and its inner layers are that size too, so an instance stretched wider wouldn't move them. That's why the portfolio site's project cards (464 by 376 on the page) stay drawn.
- **Look.** Every paint and type setting has to be the same token. A state that's an attribute, not a class (a disabled field), only shows up here.

The instance gets the page's text as overrides, and the page's picture in a slot. Anything that doesn't match on all four stays drawn, with Rost's tokens. Across the portfolio site's nine pages that's about a hundred instances, and on the accounting app's four screens 37.

The library's variants have ids made from their names (`c1hlr87e` is `Badge/status=default, size=medium`), so rebuilding the library doesn't break the instances that point at it. Renaming a variant does: rebuild the apps' files after that.

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
