# @vllnt/typescript

Shared TypeScript configurations for Node.js, libraries, React, and Next.js. Version 3 targets the native TypeScript 7 compiler while retaining a tested TypeScript 6 migration path.

Use these independently in any project; no vllnt monorepo or runtime dependency
is required. Extend a preset, then supply project-specific paths and ambient types.

## For coding agents

The documentation ships inside the package: `node_modules/@vllnt/typescript/` contains `README.md`, `llms.txt` and `CHANGELOG.md` next to the preset files, and they match the installed version. Read them before writing a `tsconfig.json`.

## Install

For TypeScript 7 projects:

```sh
pnpm add --save-dev @vllnt/typescript@^3 typescript@^7
```

For tools that still require the TypeScript JavaScript API, install TypeScript 7 as the build compiler and TypeScript 6 under the canonical package name:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "@vllnt/typescript": "^3.0.0",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

This is the [official side-by-side migration arrangement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/): `tsc` runs TypeScript 7, `tsc6` runs TypeScript 6, and tools such as `typescript-eslint` can continue importing the TypeScript 6 API.

## Presets

Extend one preset per project. Every preset extends `base.json`, so it inherits the [base defaults](#base-defaults).

| Preset              | Extend it for                                                     | Module / resolution | Target / lib                       | Emit                                  | Other options                                                  |
| ------------------- | ----------------------------------------------------------------- | ------------------- | ---------------------------------- | ------------------------------------- | -------------------------------------------------------------- |
| `base.json`         | Other environments; you set `module`, `target` and `lib` yourself | Not set             | Not set                            | Not set                               | Strictness and interop defaults only                           |
| `nodejs.json`       | Node.js applications                                              | NodeNext / NodeNext | ES2024 / ES2024                    | JavaScript, declarations, source maps | None                                                           |
| `node-library.json` | Publishable npm packages                                          | NodeNext / NodeNext | ES2024 / ES2024                    | JavaScript, declarations and maps     | `declarationMap`                                               |
| `react.json`        | Bundled React applications (for example Vite)                     | ESNext / Bundler    | ES2022 / DOM, DOM.Iterable, ES2024 | JavaScript, declarations, source maps | `jsx: "react-jsx"`                                             |
| `nextjs.json`       | Next.js applications                                              | ESNext / Bundler    | ES2022 / DOM, DOM.Iterable, ES2024 | None (`noEmit`)                       | `jsx: "preserve"`, `allowJs`, `incremental`, the `next` plugin |

Emitting presets do not enable `incremental`. Unless you opt in, a clean build emits every output even when a `.tsbuildinfo` file is left over. If you set `incremental: true`, delete the `.tsbuildinfo` file together with the output directory before a clean build. `nextjs.json` keeps `incremental` because it does not emit; if you override `noEmit`, also set `incremental: false`.

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
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `exactOptionalPropertyTypes: true`
- `forceConsistentCasingInFileNames: true`
- `skipLibCheck: true`
- `esModuleInterop: true`
- `resolveJsonModule: true`
- `stableTypeOrdering: true`
- `libReplacement: false`
- `types: []`

Ambient type packages are intentionally opt-in. List every required package in the consuming project's `types` array. Emitting projects must also set `rootDir` explicitly.

`stableTypeOrdering` aligns TypeScript 6 output with TypeScript 7. It can make TypeScript 6 type-checking slower; TypeScript 7 always uses stable ordering.

## Migrating from version 2

Version 3 turns on four more flags in `base.json`, so every preset inherits them. Each one adds diagnostics, and none changes JavaScript output. `exactOptionalPropertyTypes` can change inferred declarations (see below). Run `tsc --noEmit` after upgrading and fix what it reports:

| Flag                         | What it catches                                                                        | Usual fix                                                                                                   |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `noImplicitOverride`         | A method that replaces a base-class method without saying so (TS4114)                  | Add the `override` modifier, or rename the method if it was not meant to replace the base one.              |
| `noImplicitReturns`          | A function that returns a value on some paths and falls off the end on others (TS7030) | Add the missing `return` (`return undefined;` if that is intended).                                         |
| `noFallthroughCasesInSwitch` | A non-empty `case` that runs into the next one (TS7029)                                | End the case with `break`, `return` or `throw`. Empty cases that share a body are still allowed.            |
| `exactOptionalPropertyTypes` | Assigning `undefined` to a property declared `prop?: T` (TS2375, TS2379, TS2322)       | Write `prop?: T \| undefined` if `undefined` is a valid value, or leave the key out when there is no value. |

`exactOptionalPropertyTypes` is the one most likely to need many edits. `prop?: T` now means "the key may be missing", not "the value may be undefined":

```ts
interface Options {
  name?: string;
}

const a: Options = { name: undefined }; // error
const b: Options = {}; // omit the key

function build(name: string | undefined): Options {
  return name === undefined ? {} : { name }; // add the key only when it is set
}
```

The same applies to call arguments and to props you pass to libraries: `use({ name: undefined })` is an error when the parameter's type does not list `undefined`. Widen your own types, or build the object without the key.

`exactOptionalPropertyTypes` also changes declaration emit. When TypeScript infers a type that has an optional property, it now prints `count?: number` where it used to print `count?: number | undefined`. Types you annotate yourself are copied as written. If you publish a library, compare the `.d.ts` files before and after upgrading.

To adopt the flags one at a time, set the ones you are not ready for to `false` in your own `compilerOptions` (after `extends`) and remove the override as you fix each one. The fixtures in `tests/fixtures/flags` show a failing and an accepted form of each pattern.

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
| Next.js integration    | 16.4.6                                                  |
| React integration      | 19.3.1                                                  |
| Repository development | Node.js 22.13+, pnpm 11.28.8                            |

## Development

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm pack --dry-run
```

The checks compile every preset with TypeScript 6 and 7, prove that each inherited strictness flag is active, verify declaration emit, install and compile the packed package, enforce full test-helper coverage, and build real React/Vite and Next.js fixtures.

## Versioning

- **Major:** raised TypeScript floor, stricter diagnostics, target/module/emit changes, or removed/renamed presets.
- **Minor:** additive presets or backward-compatible options.
- **Patch:** fixes, documentation, tests, or CI changes without consumer-visible behavior changes.
- **Build-cache exception:** a patch may remove a build-cache default, such as `incremental`, that makes builds emit wrong or missing output. JavaScript, declaration, and source-map output of a clean build and all diagnostics must stay the same. The changelog states the cache effect and how to opt back in. 2.0.1 uses this exception.

## Documentation and support

- [LLM index](llms.txt) · [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md) · [Issues](https://github.com/vllnt/typescript/issues)
- [Security policy and private reporting](SECURITY.md)

npm `latest` is stable `3.0.0` at this audit. `@canary` selects moving prereleases;
pin and test them before adoption. The compatibility matrix above describes
this version's tested integrations, not a requirement to use every framework.

## Related packages

- [`@vllnt/eslint-config`](https://oss.vllnt.com/packages/eslint-config): strict ESLint presets for TypeScript projects. Use it for lint rules and `@vllnt/typescript` for compiler options; they are installed and configured separately.

## Author

Built by [bntvllnt](https://github.com/bntvllnt) · [bntvllnt.com](https://bntvllnt.com).
[Sponsor the work](https://github.com/sponsors/bntvllnt).

## License

[MIT](LICENSE)

Part of vllnt oss: <https://oss.vllnt.com>
