# @vllnt/typescript

Shared tsconfig presets for Node.js apps, npm libraries, React and Next.js, with strict type-checking, tested with TypeScript 6 and 7.

## For coding agents

These docs ship in `node_modules/@vllnt/typescript/` (`README.md`, `llms.txt`, `CHANGELOG.md`) and match the installed version. The package contains only JSON presets for `extends`; there is no JavaScript or type export to import.

## When to use

- Use it when one `extends` line should set the compiler options of a Node.js app, an npm library, a bundled React app or a Next.js app.
- Use it when the project compiles with TypeScript 7, or with TypeScript 6.0.2 or newer.
- Do not use it on TypeScript 5 or older, or for ES5 output (TypeScript 7 removed `target: "ES5"`): use a `@tsconfig/*` preset made for your TypeScript version and runtime, such as `@tsconfig/node22`, or your own `tsconfig.json`.
- Do not use it when the code cannot pass `strict`: write your own `tsconfig.json`. If only the extra flags fail, turn them off one at a time (see [Common tasks](#turn-off-one-strictness-flag)).

## Install

```sh
pnpm add --save-dev @vllnt/typescript@^3 typescript@^7 @types/node@^22
```

## Quick start

A Node.js application with its sources in `src/`. `tsconfig.json`:

```json
{
  "extends": "@vllnt/typescript/nodejs.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "types": ["node"] },
  "include": ["src"]
}
```

`src/index.ts`:

```ts
import { cwd } from "node:process";

export const directory: string = cwd();
```

Run `pnpm exec tsc`. It writes `dist/index.js`, `dist/index.js.map` and `dist/index.d.ts`.

## API

The package exports these files. Extend one preset per project; every preset extends `base.json`.

| Export                                | Use for                                                     | Reference                              |
| ------------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| `@vllnt/typescript/base.json`         | Strictness defaults only; you set `module`, `target`, `lib` | [base.json](#basejson)                 |
| `@vllnt/typescript/nodejs.json`       | Node.js applications                                        | [nodejs.json](#nodejsjson)             |
| `@vllnt/typescript/node-library.json` | npm packages that publish JavaScript and declarations       | [node-library.json](#node-libraryjson) |
| `@vllnt/typescript/react.json`        | React applications built by a bundler such as Vite          | [react.json](#reactjson)               |
| `@vllnt/typescript/nextjs.json`       | Next.js applications                                        | [nextjs.json](#nextjsjson)             |
| `@vllnt/typescript/package.json`      | Reading the installed version                               | [Compatibility](#compatibility)        |

Each block below is the preset's own `compilerOptions`. Options you set after `extends` replace them; arrays such as `types` and `lib` are replaced, not merged.

### base.json

```json
{
  "strict": true,
  "esModuleInterop": true,
  "forceConsistentCasingInFileNames": true,
  "isolatedModules": true,
  "skipLibCheck": true,
  "noUncheckedIndexedAccess": true,
  "noUncheckedSideEffectImports": true,
  "noImplicitOverride": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "exactOptionalPropertyTypes": true,
  "stableTypeOrdering": true,
  "types": [],
  "libReplacement": false,
  "resolveJsonModule": true
}
```

`types: []` loads no ambient `@types` package; list each one you need. `stableTypeOrdering` makes TypeScript 6 order types as TypeScript 7 does, and can make TypeScript 6 slower.

### nodejs.json

```json
{
  "lib": ["ES2024"],
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "target": "ES2024",
  "declaration": true,
  "sourceMap": true
}
```

### node-library.json

```json
{
  "lib": ["ES2024"],
  "module": "NodeNext",
  "moduleResolution": "NodeNext",
  "target": "ES2024",
  "declaration": true,
  "declarationMap": true,
  "sourceMap": true
}
```

### react.json

```json
{
  "lib": ["DOM", "DOM.Iterable", "ES2024"],
  "module": "ESNext",
  "moduleResolution": "Bundler",
  "target": "ES2022",
  "jsx": "react-jsx",
  "declaration": true,
  "sourceMap": true
}
```

### nextjs.json

```json
{
  "lib": ["DOM", "DOM.Iterable", "ES2024"],
  "module": "ESNext",
  "moduleResolution": "Bundler",
  "target": "ES2022",
  "jsx": "preserve",
  "noEmit": true,
  "incremental": true,
  "allowJs": true,
  "plugins": [{ "name": "next" }]
}
```

## Common tasks

### Build an npm library

`tsconfig.json`:

```json
{
  "extends": "@vllnt/typescript/node-library.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "types": ["node"] },
  "include": ["src"]
}
```

The build writes `.js`, `.d.ts`, `.js.map` and `.d.ts.map` files. Without `"type": "module"` in `package.json`, NodeNext writes CommonJS.

### Type-check a React app that Vite builds

`tsconfig.json`:

```json
{
  "extends": "@vllnt/typescript/react.json",
  "compilerOptions": { "noEmit": true, "types": ["react"] },
  "include": ["src"]
}
```

`src/App.tsx`:

```tsx
export function App() {
  return <h1>Hello</h1>;
}
```

To let `tsc` emit instead, replace `noEmit` with `"outDir": "dist"` and `"rootDir": "src"`.

### Configure a Next.js app

`tsconfig.json`:

```json
{
  "extends": "@vllnt/typescript/nextjs.json",
  "compilerOptions": { "types": ["node", "react"] },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The integration test builds Next.js 16.4.6 with TypeScript 7.

### Keep TypeScript 6 for tools that need its JavaScript API

`tsc` runs TypeScript 7 and `tsc6` runs TypeScript 6, so tools such as `typescript-eslint` can keep importing `typescript`. This is the [official side-by-side arrangement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). `package.json`:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "@vllnt/typescript": "^3.0.0",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

### Turn off one strictness flag

Set the flag after `extends`. `tsconfig.json`:

```json
{
  "extends": "@vllnt/typescript/nodejs.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "exactOptionalPropertyTypes": false
  },
  "include": ["src"]
}
```

### Migrating from version 2

Version 3 turns on `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` and `exactOptionalPropertyTypes` in `base.json`. They add diagnostics and leave JavaScript output unchanged. Run `tsc --noEmit` and fix what it reports; [Errors and fixes](#errors-and-fixes) lists each code. Under `exactOptionalPropertyTypes`, `prop?: T` means "the key may be missing", not "the value may be undefined". `src/options.ts`:

```ts
interface Options {
  name?: string;
}

export const a: Options = { name: undefined }; // error
export const b: Options = {};

export function build(name: string | undefined): Options {
  return name === undefined ? {} : { name };
}
```

Inferred declarations can change: an optional property that version 2 emitted in declarations as `count?: number | undefined` is now emitted as `count?: number`. Libraries should compare their `.d.ts` output when upgrading. The [flag fixtures](https://github.com/vllnt/typescript/tree/main/tests/fixtures/flags) show a failing and an accepted form of each flag.

### Migrating from version 1

Version 2 supports TypeScript `>=6.0.2 <8` and drops TypeScript 5:

1. Remove `baseUrl` and make `paths` targets relative to the project root.
2. Replace `moduleResolution: "node"` with `"NodeNext"` for Node.js or `"Bundler"` for bundled applications.
3. Set `rootDir` in projects that emit files.
4. List required ambient packages in `types`, such as `node` or `vitest/globals`.
5. Use a Next.js release that builds with TypeScript 7; the integration test uses 16.4.6.
6. Keep TypeScript 6 available side by side while ESLint or other tools require its JavaScript API.

## Errors and fixes

The package runs no code and throws nothing. These are the compiler diagnostics that the presets cause or that commonly follow from them. `tests/docs.test.mjs` reproduces each code under TypeScript 6 and 7 and finds each message in the output of at least one of them.

| Code             | Message contains                                                                                                                 | Cause                                                                                                                                                   | Fix                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| TS6053           | File '@vllnt/typescript/nodejs' not found                                                                                        | `extends` without `.json`, or the package is not installed (the message then names the specifier as written, such as `'@vllnt/typescript/nodejs.json'`) | Write the full export path, such as `@vllnt/typescript/nodejs.json`, and install the package            |
| TS2591           | Cannot find name 'process'. Do you need to install type definitions for node?                                                    | `types: []` loads no `@types` package                                                                                                                   | Install `@types/node` and add `"node"` to `types`                                                       |
| TS5011           | The common source directory of 'tsconfig.json' is './src'                                                                        | `outDir` without `rootDir`                                                                                                                              | Set `rootDir`, such as `"rootDir": "src"`                                                               |
| TS6059           | is not under 'rootDir'                                                                                                           | `include` lists files outside `rootDir`, such as `tests/` next to `src/`                                                                                | Type-check those files with a separate `tsconfig.json` that sets `noEmit`, or widen `rootDir`           |
| TS2835           | Relative import paths need explicit file extensions in ECMAScript imports                                                        | NodeNext in a package with `"type": "module"`                                                                                                           | Import `./file.js`, not `./file`                                                                        |
| TS1309           | The current file is a CommonJS module and cannot use 'await' at the top level                                                    | Top-level `await` under NodeNext without `"type": "module"`                                                                                             | Add `"type": "module"` to `package.json`, or rename the file to `.mts`                                  |
| TS5110           | Option 'module' must be set to 'NodeNext' when option 'moduleResolution' is set to 'NodeNext'                                    | `module` overridden on `nodejs.json` or `node-library.json`                                                                                             | Override `module` and `moduleResolution` together, or extend `react.json` for bundled code              |
| TS5109 / TS5095  | Option 'moduleResolution' must be set to 'NodeNext' (or left unspecified) when option 'module' is set to 'NodeNext'              | `moduleResolution: "Bundler"` alone on `nodejs.json` or `node-library.json`                                                                             | The same                                                                                                |
| TS5102 / TS5101  | Option 'baseUrl' has been removed / Option 'baseUrl' is deprecated                                                               | `baseUrl`, `downlevelIteration` or `outFile` in your `tsconfig.json`                                                                                    | Remove the option; make `paths` targets relative, and bundle instead of `outFile`                       |
| TS5108 / TS5107  | Option 'target=ES5' has been removed / Option 'target=ES5' is deprecated                                                         | A removed value: `target: "ES5"`, `moduleResolution: "node"` or `"classic"`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false`            | Remove the option, or use a supported value                                                             |
| TS5052           | Option 'exactOptionalPropertyTypes' cannot be specified without specifying option 'strictNullChecks'                             | `strict: false` (or `strictNullChecks: false`) while `exactOptionalPropertyTypes` is on                                                                 | Also set `exactOptionalPropertyTypes: false`                                                            |
| TS17004          | Cannot use JSX unless the '--jsx' flag is provided                                                                               | A `.tsx` file in a project on `nodejs.json`, `node-library.json` or `base.json`                                                                         | Extend `react.json` or `nextjs.json`, or set `jsx`                                                      |
| TS2882           | Cannot find module or type declarations for side-effect import                                                                   | `noUncheckedSideEffectImports` with an import such as `import "./styles.css"`                                                                           | Fix the path, or declare the module, such as `declare module "*.css";`, or add `vite/client` to `types` |
| TS18048 / TS2532 | 'first' is possibly 'undefined' / Object is possibly 'undefined'                                                                 | `noUncheckedIndexedAccess`: `array[0]` and `record[key]` have type `T \| undefined`                                                                     | Check for `undefined` before use                                                                        |
| TS4114           | This member must have an 'override' modifier                                                                                     | `noImplicitOverride`                                                                                                                                    | Add `override` to the method, or rename it if it was not meant to replace the base method               |
| TS7030           | Not all code paths return a value                                                                                                | `noImplicitReturns`                                                                                                                                     | Return on every path, `return undefined;` if intended                                                   |
| TS7029           | Fallthrough case in switch                                                                                                       | `noFallthroughCasesInSwitch`                                                                                                                            | End each non-empty `case` with `break`, `return` or `throw`; empty cases that share a body are allowed  |
| TS2375           | Type '{ name: undefined; }' is not assignable to type 'Options' with 'exactOptionalPropertyTypes: true'                          | `exactOptionalPropertyTypes`: `undefined` given to `prop?: T`                                                                                           | Write `prop?: T \| undefined`, or leave the key out                                                     |
| TS2379           | Argument of type '{ name: undefined; }' is not assignable to parameter of type 'Options' with 'exactOptionalPropertyTypes: true' | The same, in a call argument                                                                                                                            | The same                                                                                                |
| TS2412           | Type 'undefined' is not assignable to type 'string' with 'exactOptionalPropertyTypes: true'                                      | The same, in an assignment such as `options.name = undefined`                                                                                           | The same, or `delete options.name`                                                                      |

## Limits and gotchas

- The presets set no `outDir`, `rootDir`, `paths`, `include` or `files`. TypeScript resolves those relative to the file that sets them, so set them in your own `tsconfig.json`.
- `extends` must name an exported path with `.json`; `@vllnt/typescript/nodejs` fails with TS6053.
- `nodejs.json` and `node-library.json` use NodeNext: the nearest `package.json` `"type"` decides between ESM and CommonJS output for `.ts` files (`.mts` is always ESM, `.cts` always CommonJS), and ESM needs file extensions in relative imports.
- Emitting presets do not enable `incremental`, so a clean build emits every file even when a `.tsbuildinfo` is left over. If you set `incremental: true`, delete the `.tsbuildinfo` with the output directory before a clean build.
- `nextjs.json` keeps `incremental` because it sets `noEmit`. If you override `noEmit`, also set `incremental: false`.
- The `next` plugin in `nextjs.json` is an editor language-service plugin. `tsc` ignores it, and TypeScript 7 `--showConfig` leaves it out.
- `skipLibCheck: true` skips type errors inside `.d.ts` files, including those of dependencies.
- `strict: false` alone fails with TS5052, because `exactOptionalPropertyTypes` needs `strictNullChecks`. Also set `exactOptionalPropertyTypes: false`.
- TypeScript 7 removed `target: "ES5"`, `moduleResolution: "node"` and `"classic"`, `esModuleInterop: false`, `allowSyntheticDefaultImports: false` (TS5108), and `baseUrl`, `downlevelIteration` and `outFile` (TS5102). TypeScript 6 reports them as deprecated.
- Under `exactOptionalPropertyTypes`, an optional property whose type is inferred, which version 2 emitted in declarations as `count?: number | undefined`, is now emitted as `count?: number`. Types you annotate yourself are copied as written, so a written `count?: number | undefined` keeps `undefined`.
- Install the `@types/node` major that matches your Node.js runtime; 22 is the oldest supported.

## Compatibility

| Surface                | Supported version                                                                |
| ---------------------- | -------------------------------------------------------------------------------- |
| TypeScript (peer)      | `>=6.0.2 <8`                                                                     |
| Node.js consumers      | `>=22`                                                                           |
| Tested compilers       | TypeScript 7.0.2, and `@typescript/typescript6` 6.0.2 (its `tsc6` reports 6.0.3) |
| Next.js integration    | 16.4.6                                                                           |
| React integration      | 19.3.1                                                                           |
| Vite integration       | 8.3.8                                                                            |
| Repository development | Node.js 22.13+, pnpm 12.22.0                                                     |

The integration rows are the tested versions, not requirements.

## Testing

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm pack --dry-run
```

The checks type-check the repository scripts and tests and compile every preset with TypeScript 6 and 7, prove that each inherited strictness flag is active, verify declaration emit, install and compile the packed package, check this README against the packed package, enforce full test-helper coverage, and build real React/Vite and Next.js fixtures.

## Versioning

- **Major:** raised TypeScript floor, stricter diagnostics, target/module/emit changes, or removed/renamed presets.
- **Minor:** additive presets or backward-compatible options.
- **Patch:** fixes, documentation, tests, or CI changes without consumer-visible behavior changes.
- **Build-cache exception:** a patch may remove a build-cache default, such as `incremental`, that makes builds emit wrong or missing output. JavaScript, declaration, and source-map output of a clean build and all diagnostics must stay the same. The changelog states the cache effect and how to opt back in. 2.0.1 uses this exception.

npm `latest` is the newest stable release. `@canary` selects moving prereleases built from `main`; pin and test them before adoption. See the [changelog](CHANGELOG.md) and the [LLM index](llms.txt).

## Security

Report vulnerabilities privately as described in the [security policy](https://github.com/vllnt/typescript/blob/main/SECURITY.md).

## Related packages

- [`@vllnt/eslint-config`](https://oss.vllnt.com/packages/eslint-config): ESLint presets for TypeScript projects. It sets lint rules and `@vllnt/typescript` sets compiler options; each is installed and configured on its own. This repository uses both: `eslint.config.mjs` imports `@vllnt/eslint-config/nodejs` (a devDependency) and lints the scripts and tests.

## Contributing

See [CONTRIBUTING.md](https://github.com/vllnt/typescript/blob/main/CONTRIBUTING.md) and the [issues](https://github.com/vllnt/typescript/issues).

## Links

- Docs and changelog: [oss.vllnt.com/packages/typescript](https://oss.vllnt.com/packages/typescript) · [release feed](https://oss.vllnt.com/packages/typescript/rss.xml)
- All @vllnt packages: [oss.vllnt.com](https://oss.vllnt.com) · [search packages and docs on index.vllnt.com](https://index.vllnt.com)
- Source and issues: [GitHub](https://github.com/vllnt/typescript) · [issues](https://github.com/vllnt/typescript/issues)
- Questions and updates: [Discord](https://bntvllnt.com/discord) · [X @bntvllnt](https://x.com/bntvllnt)
- Company and author: [vllnt.com](https://vllnt.com) · [bntvllnt.com](https://bntvllnt.com) · [GitHub @bntvllnt](https://github.com/bntvllnt) · [LinkedIn](https://linkedin.com/in/bntvllnt)
- Sponsor: [GitHub Sponsors](https://github.com/sponsors/bntvllnt)

## License

[MIT](LICENSE)

---

Part of [vllnt open source](https://oss.vllnt.com) · [Package page](https://oss.vllnt.com/packages/typescript) · [vllnt.com](https://vllnt.com) · Built by [bntvllnt](https://bntvllnt.com)
