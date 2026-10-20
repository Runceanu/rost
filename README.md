# Rost

Rost started as a design system for my own needs and grew into a product of its own. Today it serves products across different industries. The portfolio site and the accounting app are two of them, and none of them owns it.

*Rost* is the Romanian word for purpose or order, in the sense that something is where it belongs.

Each component is a **contract**: one YAML file that says what the component is, which values it uses, how to use it, and where each of my apps implements it. Apps build against that one file instead of keeping their own copy.

**Start with the docs: [docs/README.md](docs/README.md).** That's the catalogue, plus [how a contract works](docs/CONTRACT.md) and [what's next](docs/ROADMAP.md). If you'd rather browse, the same content with every value of every variant lives at [rost.build](https://rost.build).

```
contracts/  one YAML contract per component
schema/     the contract format (JSON Schema v2) and a template
tokens/     tokens.css and tokens.json
registry/   what exists in the Figma file: components, variants, node ids, icons
baseline/   Figma's own render of each variant, the target for the coded versions
assets/     icons and vector parts exported from Figma
docs/       written by hand: CONTRACT.md, ROADMAP.md. Generated: the rest
web/        the website at rost.build, built from everything above
src/        the conformance check
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
npm run css -- inline-banner           # write a component's CSS from its contract
npm run test:visual -- inline-banner   # render it and compare with Figma, pixel by pixel
```

```bash
node bin/audit.mjs <app-dir> [<app-dir>...]   # undefined vars, raw hex, tokens the kit doesn't have
```

To check an app, import `src/conform.ts` in one of its tests. The accounting app's `src/contracts/__tests__/contract.test.ts` shows how.

## Where it stands

22 contracts, all read from Figma, and validation is clean. I signed off the guidance on 16 of them on 2026-10-19. Badge and InlineBanner are built in code from their contracts, and every one of their 16 variants matches Figma in the visual test. Badge changed in Figma since August (it has a small dot-only size now), so its guidance is waiting for me to sign it off again. On 2026-10-20 I froze the contracts: they're the source now, not Figma. Changes happen in the YAML. The [roadmap](docs/ROADMAP.md) has the details.
