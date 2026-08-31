# Contributing to @vllnt/typescript

Thank you for helping improve the shared TypeScript presets.

## Requirements

- Node.js 22.13 or newer
- pnpm 11.24.0

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
4. Update `README.md`, `CHANGELOG.md`, `llms.txt`, and `llms-full.txt` with public behavior.
5. Run `pnpm check` and inspect the package tarball.

Do not bump versions, create tags, publish to npm, or trigger a stable release unless a maintainer explicitly requests it.
