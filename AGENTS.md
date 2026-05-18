# Agent Instructions for @vllnt/typescript

This repository contains the public `@vllnt/typescript` npm package.

## Scope

- Keep changes focused on TypeScript configuration presets, tests, docs, and release-readiness files.
- Do not publish to npm, create tags, bump versions, merge PRs, or announce releases unless explicitly instructed by a human maintainer.
- Do not add private VLLNT operational details, credentials, customer data, or internal roadmap content to public files.

## Commands

Use npm:

```bash
npm test
npm pack --dry-run
```

## Package constraints

- Preserve Node.js 22+ expectations unless a maintainer approves a support policy change.
- Keep `package.json` `files` aligned with the published preset JSON files.
- Update smoke tests when preset files change.
- Update `README.md`, `CHANGELOG.md`, `llms.txt`, and `llms-full.txt` when changing public presets or package positioning.

## Review checklist

Before handoff, report:

- files changed;
- checks run and results;
- whether any release action was intentionally not taken.
