# Rost

My design system. Rost started as a design system for my own needs and grew into a product of its own. Today it serves products across different industries. The portfolio site and the accounting app are two of them.

## How the docs sound

Every piece of prose in this repo is written in my voice: the README, `docs/`, the `guidance` in each contract, element and value `notes`, and the text the doc builders print around the generated tables. It should read like I wrote it, not like a generator did.

- Plain words, short sentences. Say the thing, then stop.
- Define things directly, the way I would: "Rost is the Romanian word for purpose or order, in the sense that something is where it belongs." No poetic build-up, no closing line for effect ("That's the whole job here").
- First person where it's natural ("I keep badges quiet on purpose"). It's my system.
- Honest about what's unfinished or wrong. No selling.
- Warm, not corporate. No buzzwords, no "leverage", no "robust", no "seamless".
- Never an em-dash. Commas, periods, colons or parentheses instead.
- No neat lists of three for rhythm, no paragraphs that all open the same way.
- Fragments are fine. Bullets when there are really several things.
- Code, token paths and file names stay exact, in backticks.

The tables (values, tokens, props) are data and stay as they are. The words around them follow the rules above.

## Publishing

This repo is public. Before pushing, check nothing private gets in: client names (they're "Client N" here), the names or addresses of my apps' websites (they're "the accounting app" and "the portfolio site" here, `accounting-app` and `portfolio-site` as keys), real people's names or photos, my working notes (`STATUS.md` stays local), local paths, or any registry that isn't public npm (`.npmrc` pins it).
