# @vllnt/typescript

Shared TypeScript configurations for Node.js, libraries, React, and Next.js. Version 2 targets the native TypeScript 7 compiler while retaining a tested TypeScript 6 migration path.

Use these independently in any project; no vllnt monorepo or runtime dependency
is required. Extend a preset, then supply project-specific paths and ambient types.

## Install

For TypeScript 7 projects:

```sh
pnpm add --save-dev @vllnt/typescript@^2 typescript@^7
```

For tools that still require the TypeScript JavaScript API, install TypeScript 7 as the build compiler and TypeScript 6 under the canonical package name:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "@vllnt/typescript": "^2.0.0",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

This is the [official side-by-side migration arrangement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/): `tsc` runs TypeScript 7, `tsc6` runs TypeScript 6, and tools such as `typescript-eslint` can continue importing the TypeScript 6 API.

## Presets

| Preset              | Use case                             | Module resolution | Target    | Emit                                  |
| ------------------- | ------------------------------------ | ----------------- | --------- | ------------------------------------- |
| `base.json`         | Foundation extended by other presets | Inherited         | Inherited | Inherited                             |
| `nodejs.json`       | Node.js applications                 | NodeNext          | ES2024    | JavaScript, declarations, source maps |
| `node-library.json` | Publishable npm packages             | NodeNext          | ES2024    | JavaScript, declarations and maps     |
| `react.json`        | Bundled React applications           | Bundler           | ES2022    | JavaScript, declarations, source maps |
| `nextjs.json`       | Next.js applications                 | Bundler           | ES2022    | None                                  |

### Node.js application

```json
{
  "extends": "@vllnt/typescript/nodejs.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

### Node library

```json
{
  "extends": "@vllnt/typescript/node-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

### React

```json
{
  "extends": "@vllnt/typescript/react.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "types": ["react"]
  },
  "include": ["src"]
}
```

### Next.js

```json
{
  "extends": "@vllnt/typescript/nextjs.json",
  "compilerOptions": {
    "types": ["node", "react"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Base defaults

Every specialized preset inherits:

- `strict: true`
- `isolatedModules: true`
- `noUncheckedIndexedAccess: true`
- `noUncheckedSideEffectImports: true`
- `forceConsistentCasingInFileNames: true`
- `skipLibCheck: true`
- `esModuleInterop: true`
- `resolveJsonModule: true`
- `stableTypeOrdering: true`
- `libReplacement: false`
- `types: []`

Ambient type packages are intentionally opt-in. List every required package in the consuming project's `types` array. Emitting projects must also set `rootDir` explicitly.

`stableTypeOrdering` aligns TypeScript 6 output with TypeScript 7. It can make TypeScript 6 type-checking slower; TypeScript 7 always uses stable ordering.

## Migrating from version 1

Version 2 supports TypeScript `>=6.0.2 <8` and drops TypeScript 5. Before upgrading:

1. Remove `baseUrl` and make `paths` targets relative to the project root.
2. Replace legacy `moduleResolution: "node"` with `"NodeNext"` for Node.js or `"Bundler"` for bundled applications.
3. Set `rootDir` in projects that emit files.
4. List required ambient packages in `types`, such as `node` or `vitest/globals`.
5. Use Next.js 16.3 or newer when building with TypeScript 7.
6. Keep TypeScript 6 available through the side-by-side setup while ESLint or other tools require the legacy JavaScript API.

TypeScript 7 also removes ES5 targeting, legacy module formats and resolution, `downlevelIteration`, and the ability to disable `esModuleInterop`, `allowSyntheticDefaultImports`, or strict mode.

## Compatibility

| Surface                | Supported version                                       |
| ---------------------- | ------------------------------------------------------- |
| Node.js consumers      | `>=22`                                                  |
| TypeScript             | `>=6.0.2 <8`                                            |
| Tested compilers       | TypeScript 6 compatibility package and TypeScript 7.0.2 |
| Next.js integration    | 16.3.3                                                  |
| React integration      | 19.2.8                                                  |
| Repository development | Node.js 22.13+, pnpm 11.24.0                            |

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm pack --dry-run
```

The checks compile every preset with TypeScript 6 and 7, verify declaration emit, install and compile the packed package, enforce full test-helper coverage, and build real React/Vite and Next.js fixtures.

## Versioning

- **Major:** raised TypeScript floor, stricter diagnostics, target/module/emit changes, or removed/renamed presets.
- **Minor:** additive presets or backward-compatible options.
- **Patch:** fixes, documentation, tests, or CI changes without consumer-visible behavior changes.

## Documentation and support

- [LLM index](llms.txt) · [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md) · [Issues](https://github.com/vllnt/typescript/issues)
- [Security policy and private reporting](SECURITY.md)

npm `latest` is stable `2.0.0` at this audit. `@canary` selects moving prereleases;
pin and test them before adoption. The compatibility matrix above describes
this version's tested integrations, not a requirement to use every framework.

## Author

Built by [bntvllnt](https://github.com/bntvllnt) · [bntvllnt.com](https://bntvllnt.com).
Part of [@vllnt](https://github.com/vllnt). [Sponsor the work](https://github.com/sponsors/bntvllnt).

## License

[MIT](LICENSE)
