# @vllnt/typescript

Public shared TypeScript presets for Node.js, libraries, React, and Next.js. The goal is a small, strict, independently installable config package with verified TypeScript 6/7 behavior.

## Agent instructions

`AGENTS.md` is the sole agent-instruction source for this repository. Do not add
`CLAUDE.md` or `.claude` content.

## Repository map

- `*.json` — published compiler presets; `base.json` owns shared defaults.
- `tests/fixtures/` — compiler contract fixtures for every preset.
- `tests/integration/` — real React/Vite and Next.js builds.
- `scripts/test-utils.mjs` and `tests/configs.test.mjs` — package, compiler, and emit validation.
- `.github/workflows/` — pull-request checks, canary publishing, and manual stable releases.
- `README.md`, `CHANGELOG.md`, `llms*.txt` — public contract and migration documentation.

## Invariants

- Use pnpm and keep `pnpm-lock.yaml` deterministic.
- Keep `package.json` files and exports aligned with every public preset.
- Treat strictness, compiler floors, module resolution, target, and emit changes as public API changes.
- Synchronize public behavior across README, changelog, and LLM manifests.
- Do not publish, tag, merge, or announce a release without explicit maintainer instruction.
- Run `pnpm check` and `pnpm pack --dry-run` before handoff.
