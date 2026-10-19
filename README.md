# Rost

A design system run as its own product. The portfolio site, the accounting app and every product after them build on it; none of them owns it. *Rost* is Romanian for purpose, or order: the sense that something belongs where it is.

UI Kit v01 as a **contract**, so apps and plugins build against one source instead of each keeping its own copy.

**Documentation starts at [docs/README.md](docs/README.md)**: the component catalogue, [what a contract is](docs/CONTRACT.md), and the [roadmap](docs/ROADMAP.md). `reference.html` is the same content with every value of every variant, for browsing.

```
schema/     the contract format (JSON Schema v2) and a template contract
registry/   what actually exists in Figma — components, variants, node ids, token paths, icons
tokens/     tokens.css and tokens.json
contracts/  one YAML contract per component: values read from Figma, plus guidance and implementations
docs/       CONTRACT.md and ROADMAP.md by hand; README.md and components/ generated
src/        conformance checking
bin/        repo auditing
```

## Why a contract and not just tokens

Tokens alone did not stop the drift. The Badge in accounting-app was built by inferring a component from its tokens rather than reading the node, and it was wrong three ways at once: a background fill the kit does not have, a status-coloured label the kit keeps tertiary, and an outline drawn from the wrong token family.

A contract states what was read and from which node. Conformance then fails the build when code stops matching. Crucially it compares **token paths**, not only pixels — six tokens in this kit resolve to `#3a3a3a`, so a screenshot diff cannot tell a right one from a wrong one, and nothing notices until someone retunes a token and the wrong thing moves.

## Use

```bash
node bin/audit.mjs <app-dir> [<app-dir>...]   # undefined vars, raw hex, unknown tokens
```

```bash
npm run validate    # schema, cross-references, token paths
npm run docs        # validate, then docs/README.md, docs/components/*.md and reference.html
npm run deploy      # publish the reference to https://rost.silviu-runceanu.workers.dev (Cloudflare)
```

Import `src/conform.ts` in a test to check a stylesheet against the contracts. See accounting-app's `src/contracts/__tests__/contract.test.ts`.

## Status

Most contracts are skeletons pending a Figma read; each states its own gaps in `pending`.
