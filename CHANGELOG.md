# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning.

## [Unreleased]

### Changed

- Upgraded the development lint configuration to `@vllnt/eslint-config` 2.0.0.

## [2.0.0] - 2026-08-31

### Added

- Added compiler-backed fixtures for every preset under TypeScript 6 and TypeScript 7.
- Added installed-tarball, declaration-emit, React/Vite, and Next.js integration checks.
- Added pnpm, formatting, linting, Vitest, and 100% test-helper coverage gates.
- Added explicit JSON package exports and public package documentation.

### Changed

- Prepared the package as version `2.0.0` so merges publish `2.0.0-canary.<sha>` to the npm `canary` tag.
- Upgraded the primary compiler to TypeScript 7.0.2 while retaining the TypeScript 6 compatibility API for dependent tooling.
- Made ambient types explicit with `types: []`, enabled `noUncheckedSideEffectImports` and stable type ordering, and disabled library replacement.
- Updated CI and trusted publishing workflows for deterministic pnpm installs, current actions, pinned OIDC-capable npm, provenance, and generated GitHub release notes.

### Breaking

- Dropped TypeScript 5; supported compilers are now TypeScript `>=6.0.2 <8`.
- Ambient `@types` packages must be listed explicitly by consumers.
- Emitting projects must set `rootDir` explicitly to retain their intended output layout.

## [1.0.0] - 2026-03-05

### Added

- Initial public release of shared TypeScript configuration presets for VLLNT projects.
- Added `base.json`, `nodejs.json`, `node-library.json`, `react.json`, and `nextjs.json` presets.
- Documented Node.js 22+ and TypeScript 5+ expectations.

[Unreleased]: https://github.com/vllnt/typescript/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/vllnt/typescript/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/vllnt/typescript/releases/tag/v1.0.0
