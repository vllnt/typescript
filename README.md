# @vllnt/typescript

Shared TypeScript configurations for vllnt projects. Strict, modern, Node 22+, and validated with TypeScript 6 and 7.

## Install

```sh
npm install -D @vllnt/typescript typescript
```

## Presets

| Preset | Use case | Module | Target |
|--------|----------|--------|--------|
| `base.json` | Foundation (extended by others) | - | - |
| `nodejs.json` | Node.js applications | NodeNext | ES2024 |
| `node-library.json` | Publishable npm packages | NodeNext | ES2024 |
| `react.json` | React apps (Vite, CRA, etc.) | ESNext | ES2022 |
| `nextjs.json` | Next.js applications | ESNext | ES2022 |

## Usage

Extend a preset in your `tsconfig.json`:

### Node.js application

```json
{
  "extends": "@vllnt/typescript/nodejs.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Node library (npm package)

```json
{
  "extends": "@vllnt/typescript/node-library.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
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
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Next.js

```json
{
  "extends": "@vllnt/typescript/nextjs.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## What's included

All presets extend `base.json` which enforces:

- `strict: true`
- `isolatedModules: true`
- `noUncheckedIndexedAccess: true`
- `noUncheckedSideEffectImports: true`
- `skipLibCheck: true`
- `esModuleInterop: true`
- `resolveJsonModule: true`
- `stableTypeOrdering: true`
- `types: []` (ambient type packages must be listed explicitly)

On TypeScript 6, `stableTypeOrdering` can make type-checking slower (up to 25% according to the [TypeScript 6 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)). It is enabled here so TypeScript 6 uses TypeScript 7's deterministic type ordering during migration; TypeScript 7 always uses this behavior.

## TypeScript 7

Version 2 supports TypeScript 6 and 7, drops TypeScript 5, and makes ambient type packages opt-in. TypeScript 7 is a native compiler and no longer exposes the JavaScript compiler API used by tools such as `typescript-eslint` and legacy `tsserver` integrations. Use TypeScript 7 directly when every tool in the project invokes the compiler CLI:

```sh
npm install -D @vllnt/typescript typescript@^7
```

During the ecosystem transition, install TypeScript 7 for `tsc` and keep the TypeScript 6 API available under the canonical `typescript` package name:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "@vllnt/typescript": "^2.0.0",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

This arrangement follows the [official TypeScript 7 side-by-side guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). It provides TypeScript 7 as `tsc`, TypeScript 6 as `tsc6`, and the TypeScript 6 JavaScript API to dependent tooling.

Before switching a consumer to TypeScript 7:

- Remove `baseUrl`; make every `paths` target relative to the project root.
- Replace `moduleResolution: "node"` with `"NodeNext"` for Node.js or `"Bundler"` for bundled applications.
- Set `rootDir` explicitly for emitting projects.
- List required ambient packages in `types`, for example `types: ["node", "vitest/globals"]`.
- Use Next.js 16.3 or newer. Next.js 16.2.12 requires `experimental.useTypeScriptCli: true`.

## Requirements

- Node.js >= 22
- TypeScript >= 6.0.2 and < 8

## License

MIT
