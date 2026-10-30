// The docs on the site are the same markdown files that live in the repo.
// Here, not in the page, because getStaticPaths can't see the page's own code.
export const DOCS = {
  contract: { file: 'docs/CONTRACT.md', title: 'How a contract works' },
  roadmap: { file: 'docs/ROADMAP.md', title: "What's next" },
  tokens: { file: 'docs/TOKENS.md', title: 'Token coverage' },
  accessibility: { file: 'docs/ACCESSIBILITY.md', title: 'Accessibility' },
  releases: { file: 'docs/CHANGELOG.md', title: 'Release notes' },
} as const
