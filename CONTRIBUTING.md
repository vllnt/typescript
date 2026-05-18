# Contributing to @vllnt/typescript

Thank you for helping improve `@vllnt/typescript`.

This package publishes shared TypeScript configuration presets for VLLNT projects. Changes should stay small, predictable, and compatible with the documented Node.js and TypeScript requirements.

## Development

Requirements:

- Node.js 22 or newer
- npm 10 or compatible

Run the smoke tests:

```bash
npm test
```

Preview package contents before release-oriented changes:

```bash
npm pack --dry-run
```

## Pull requests

Before opening a pull request:

1. Create a branch from `main`.
2. Keep the diff scoped to one concern.
3. Update or add smoke tests when preset files change.
4. Run `npm test`.
5. Update `README.md` and `CHANGELOG.md` for public preset changes.

## Release notes

Do not bump versions, create tags, publish to npm, or trigger release workflows from a documentation or feature PR unless the maintainer explicitly asks for a release.

## Preset constraints

- Preserve strict defaults in `base.json` unless a breaking change is intentional and documented.
- Keep each preset focused on its named runtime or framework.
- Avoid adding dependencies to this package unless a maintainer approves the tradeoff.
- Keep `files` in `package.json` aligned with the published presets.
