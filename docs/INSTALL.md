# Install

Rost's components get copied into your app, the way shadcn's do. You own the copy. Nothing to import from a package, nothing to keep in step with a version number.

Every component that's in code is in a registry on rost.build, at `https://rost.build/r/<id>.json`. The list of them is at [`/r/registry.json`](https://rost.build/r/registry.json).

## In an app that uses shadcn

The shadcn CLI reads Rost's registry as it is:

```sh
npx shadcn add https://rost.build/r/button.json
```

Add as many as you like in one go. A component brings what it needs: Input brings IconButton, Tabs brings TabItem.

## In any other app

`bin/rost.mjs` does the same job without shadcn, Tailwind or a `components.json`:

```sh
node path/to/rost/bin/rost.mjs add button input
node path/to/rost/bin/rost.mjs list
```

It's not on npm yet. When it is, that's `npx rost add button`.

Run `add` with no names to bring every component the app already has up to the current version.

## What lands where

- `src/rost/<id>/` holds the component, its CSS and its icons.
- `src/rost/tokens.css` and `src/rost/fonts.css` are the tokens, in dark and light, and General Sans.
- `src/rost/conform.ts` is the check that a copy still matches its contract. The apps run it in their tests.
- `contracts/rost/<id>.contract.yaml` is the contract, the same file as in this repo.

Import the two stylesheets once, at the root of the app:

```ts
import './rost/fonts.css'
import './rost/tokens.css'
```

The components are React (19 or later) with plain CSS. No Tailwind, no CSS-in-JS. Each one imports its own stylesheet, so your bundler has to handle a CSS import. Vite, Next and Astro all do.

## Changing a component

You can, it's your copy. But the next `add` puts Rost's version back. If the change is right for Rost, make it in the contract here and every app gets it. If it's only right for one app, write it down as a deviation in that app's contract copy, so the conformance check knows it's on purpose.

## What isn't right yet

- The files go into `src/`. An app without one gets a `src/` folder anyway. I'll add an option when an app needs it.
- A file Rost deletes from a component stays in your copy. `bin/add.mjs`, the older script for apps that sit next to this repo, replaces the whole folder and doesn't have that problem.
