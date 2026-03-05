# @vllnt/typescript

Shared TypeScript configurations for vllnt projects. Strict, modern, Node 22+.

## Install

```sh
npm install -D @vllnt/typescript
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
- `skipLibCheck: true`
- `esModuleInterop: true`
- `resolveJsonModule: true`

## Requirements

- Node.js >= 22
- TypeScript >= 5.0

## License

MIT
