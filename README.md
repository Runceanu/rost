# Rost

Rost started as a design system for my own needs and grew into a product of its own. Today it serves products across different industries. The portfolio site and the accounting app are two of them, and none of them owns it.

*Rost* is the Romanian word for purpose or order, in the sense that something is where it belongs.

Each component is a **contract**: one YAML file that says what the component is, which values it uses, how to use it, and where each of my apps implements it. Apps build against that one file instead of keeping their own copy.

**Start with the docs: [docs/README.md](docs/README.md).** That's the catalogue, plus [how a contract works](docs/CONTRACT.md) and [what's next](docs/ROADMAP.md). If you'd rather browse, the same content with every value of every variant lives at [rost.build](https://rost.build).

```
contracts/  one YAML contract per component
schema/     the contract format (JSON Schema v2) and a template
tokens/     tokens.css, tokens.json, and fonts.css (General Sans, placed where Figma puts it)
registry/   what exists in the Figma file: components, variants, node ids, icons
baseline/   Figma's own render of each variant, the target for the coded versions
assets/     icons and vector parts exported from Figma
docs/       written by hand: CONTRACT.md, ROADMAP.md. Generated: the rest
web/        the website at rost.build, built from everything above
src/        the conformance check, and the components built in code (src/components/)
raw/        what the Figma reads returned, before parsing
bin/        reading Figma, building docs, auditing apps
```

## Why contracts, not just tokens

Tokens alone didn't stop the drift. I built the first Badge in the accounting app by guessing the component from its tokens instead of reading the actual Figma node. It came out wrong in three places at once: a background fill the kit doesn't have, a coloured label where the kit keeps it grey, and an outline from the wrong token family.

A contract writes down what was read, and from which node. The conformance check then fails the build when code stops matching. It compares token names, not just pixels, and that matters: six tokens in this kit come out as `#3a3a3a`. A screenshot can't tell the right one from the wrong one. Nobody notices until someone changes a token and the wrong thing moves.

## Using it

```bash
npm run validate    # schema, links between files, token names
npm run docs        # validate, then rebuild docs/
npm run site        # build the website (web/) from the contracts, components and docs
npm run site:dev    # work on the website, live, on http://localhost:4321
npm run site:preview   # look at the built site on the same port
npm run deploy      # build it and publish it to rost.build
npm run css -- thumbs           # write a component's CSS from its contract
npm run test:visual -- thumbs   # render every variant and compare it with Figma's screenshot
npm run add -- <app-dir> badge   # copy a component (and what it imports) into an app
npm run add -- <app-dir>         # update every component the app already has
```

```bash
npm run audit -- <app-dir> [<app-dir>...]   # undefined vars, raw hex, tokens the kit doesn't have
npm run audit -- --strict <app-dir>          # same, but raw hex and unknown tokens fail it too
```

To check an app, import `forApp` and `conform` from `rost/conform` in one of its tests. [How a contract works](docs/CONTRACT.md#checking-an-app) has the snippet. The accounting app doesn't do this yet: its test still reads its own old JSON copies.

## Where it stands

22 contracts, all read from Figma, and validation is clean. On 2026-10-20 I froze them: they're the source now, not Figma, and changes happen in the YAML.

Fifteen components are built in code from their contracts: Badge, InlineBanner, Thumbs, Divider, Tag, Chip, Button, IconButton, Toggle, Carousel, Projects, Testimonials, Menu, Input and TestimonialPicture. 129 of their 131 variants match Figma in the visual test. Chip Pressed is just over the line, and Projects Hover waits for a fixed Figma frame to be captured again. Four of the five effects are tokens Rost already ships. Hero Media and the Paper effect aren't in code yet. I've signed off the guidance on 15 contracts. Badge was the 16th, until Figma gave it a dot-only size, so it's back to `proposed`. The guidance I wrote this week waits for me too. Nothing is `stable` yet. The [roadmap](docs/ROADMAP.md) has the details.
