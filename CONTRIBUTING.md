# Contributing to @vllnt/typescript

Thank you for helping improve the shared TypeScript presets.

## Requirements

- Node.js 22.13 or newer
- pnpm 11.28.8

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm pack --dry-run
```

`pnpm check` runs formatting, linting, TypeScript 6/7 compiler fixtures, packed-package validation, coverage, and real React/Vite and Next.js builds.

## Pull requests

1. Branch from `main` and keep the change focused.
2. Preserve documented compiler, module, target, and emit behavior unless the change is intentionally breaking.
3. Add or update compiler fixtures for preset changes.
4. Update `README.md`, `CHANGELOG.md`, and `llms.txt` with public behavior.
5. Run `pnpm check` and inspect the package tarball.

## Releases

Maintainers only. Every publish runs in `.github/workflows/publish.yml` with npm trusted
publishing and provenance; nothing is published from a local machine.

- Canary (`@canary`): every push to `main` that touches the package publishes one; it can
  also be run manually on `main`.
- Stable (`@latest`): merge a PR that sets `package.json` `version` and adds a matching
  `## [X.Y.Z]` entry to `CHANGELOG.md`, then push the tag `vX.Y.Z` on that `main` commit.

Do not bump versions, create tags, or publish unless a maintainer explicitly requests it.
