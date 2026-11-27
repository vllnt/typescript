# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses semantic versioning.

## [3.0.1] - 2026-11-27

Presets are unchanged from 3.0.0. This release changes package metadata and the shipped documentation.

### Added

- The README follows the shared @vllnt layout for coding agents: a "For coding agents" note (the documentation ships in `node_modules/@vllnt/typescript/` and matches the installed version), When to use, Install, Quick start, API (each preset's own `compilerOptions`), Common tasks, Errors and fixes, Limits and gotchas, Compatibility, Related packages, and a Links section (package docs and release feed, package index and search, source and issues, Discord and X, company and author, sponsor), which replaces the Author section, then the footer. `llms.txt` rewrites the summary, adds the same note and when-to-use, links to the shipped `README.md` (API and errors tables) and `CHANGELOG.md` with relative paths, and ends with a six-link Ecosystem block (package page, release feed, all @vllnt packages, search, vllnt, author).
- `tests/docs.test.mjs` checks the README and `llms.txt` against the packed package under TypeScript 6 and 7: required sections in order, the install command and quick start within the first 40 lines, the `llms.txt` summary line, that the packed files include `README.md`, `llms.txt` and `CHANGELOG.md`, tagged code blocks, relative links and anchors, every export in the API table, each preset's options, and every code in "Errors and fixes" with each message found in at least one compiler's output. It compiles every README `tsconfig.json` and source example and requires exactly the diagnostics its `// error` comments mark; the Quick start and "Build an npm library" examples must emit exactly the files listed, and the other emitting examples must emit `index.js`. No packed or tracked file may name the retired vllnt domain.
- `scripts/check-package-contents.sh` checks the packed file list against an allowlist and the privacy denylist, and fails when a path listed in `.package-contents-required` is missing from the tarball. `pnpm check`, the canary job and the release job run it before publishing; it reads both the array-shaped and the npm 12 object-shaped `npm pack --json` output.
- A Privacy Guard workflow runs on every push and pull request. It checks commit author, committer and trailer emails against an allowlist of GitHub noreply addresses, rejects private hostnames and internal IPs in commit metadata, scans tracked files against a privacy denylist, and runs a gitleaks secret scan.

### Changed

- `package.json` `homepage` is https://oss.vllnt.com/packages/typescript, and `description` and `keywords` name what the package does and the stack. Publish path filters include `README.md`, `llms.txt` and `CHANGELOG.md`, so a documentation-only change publishes a canary.
- Upgraded the development dependencies `vitest` and `@vitest/coverage-v8` to 5.1.1 and `prettier` to 3.10.1, and added a scoped override to a patched `minimatch` 11 (11.0.9) for GHSA-g3hv-75wg-m249 (moderate, reached only through the development lint toolchain). Removed the unused root development dependency `@types/react-dom` (the integration fixtures declare their own). Presets and the packed file list are unchanged.
- Upgraded the development dependency `@vllnt/eslint-config` to 2.1.0 and the integration fixtures to `next` 16.4.6 and `vite` 8.3.8. No change to the presets or the packed file list.
- Moved the repository package manager to pnpm 12.22.0 (`packageManager`; the lockfile now also pins pnpm itself). No change to the presets or the packed file list.

### Fixed

- The README and `llms.txt` listed TS2322 as an `exactOptionalPropertyTypes` diagnostic; it is TS2412 (assigning `undefined` to an optional property), next to TS2375 and TS2379.
- The README said that TypeScript 7 cannot disable strict mode. It can; with these presets, `strict: false` also needs `exactOptionalPropertyTypes: false` (TS5052).
- `pnpm check` type-checks the repository scripts and tests (`pnpm typecheck`, TypeScript 6 and 7). The root `tsconfig.json` enabled `checkJs`, but nothing ran it, and it had 23 errors under TypeScript 7 and 21 under TypeScript 6. The root `tsconfig.json` sets `declaration: false`, because it only type-checks.

## [3.0.0] - 2026-11-16

### Added

- `base.json` enables `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` and `exactOptionalPropertyTypes`, so every preset inherits them. Fixtures in `tests/fixtures/flags` prove under TypeScript 6 and 7, in every preset, that each flag is active and is the only cause of its diagnostic, and that JavaScript output is the same with the flags on and off.

### Changed

- Bumped the Next.js integration fixture from 16.4.3 to 16.4.5. Next 16.4.3 is inside the range of a published security advisory (`>=16.3.0 <=16.4.4`), and Next refuses to build with it.

### Breaking

The flags add diagnostics and leave JavaScript output unchanged, but inferred declarations can differ (see the last flag below). This is a major change under the Versioning policy. See [Migrating from version 2](README.md#migrating-from-version-2).

- `noImplicitOverride`: a method that replaces a base-class method needs the `override` modifier (TS4114).
- `noImplicitReturns`: a function that returns a value on some paths must return on all of them (TS7030). Add the missing `return`, or `return undefined;`.
- `noFallthroughCasesInSwitch`: a non-empty `case` must end with `break`, `return` or `throw` (TS7029). Empty cases that share a body are unaffected.
- `exactOptionalPropertyTypes`: `prop?: T` no longer accepts an explicit `undefined` (TS2375, TS2379, TS2322). Write `prop?: T | undefined`, or leave the key out.
- Declaration emit under `exactOptionalPropertyTypes`: the `.d.ts` that TypeScript infers can differ. For example, an inferred `count?: number | undefined` is emitted as `count?: number`. Libraries that publish declarations should compare their `.d.ts` output when upgrading.
- To adopt them one at a time, set a flag to `false` in your own `compilerOptions` after `extends`.

## [2.0.1] - 2026-11-16

### Changed

- Clarified standalone preset usage and release channels; retained `llms.txt` as the maintained LLM index and removed `llms-full.txt` from the repository and package contents.
- Corrected the documented Next.js and React integration versions and the development pnpm version.
- Stable releases are now published only from a `vX.Y.Z` tag on `main` that matches `package.json` and this changelog; canary releases still publish on every push to `main`. Workflows pin actions, avoid credential persistence, and narrow the secrets passed to the leak gate.
- Set the pnpm release-age policy in `pnpm-workspace.yaml`, moved to pnpm 11.28.8, and added low-memory development defaults.
- Upgraded the development lint configuration to `@vllnt/eslint-config` 2.0.0 and refreshed development and integration-test dependencies, with scoped overrides for patched releases of two transitive development dependencies (`handlebars`, `deepmerge-ts`).

### Fixed

- `nodejs.json` and `react.json` no longer enable `incremental`. With it, a clean build that deleted only the output directory could reuse a leftover `.tsbuildinfo` and emit nothing, so a package could be published empty. JavaScript, declaration, and source-map output of a clean build is unchanged; only build caching changes, so this ships as a patch under the README's build-cache exception. Ordinary `tsc` and `tsc --project` builds using these presets are no longer incremental and no longer write a `.tsbuildinfo`; `tsc --build` and `composite` projects still write one. To restore caching for ordinary builds, set `incremental: true` in your project; setting only `tsBuildInfoFile` is not enough. `nextjs.json` keeps `incremental` because it does not emit.

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

[3.0.1]: https://github.com/vllnt/typescript/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/vllnt/typescript/compare/v2.0.1...v3.0.0
[2.0.1]: https://github.com/vllnt/typescript/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/vllnt/typescript/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/vllnt/typescript/releases/tag/v1.0.0
