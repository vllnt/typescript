# @vllnt/typescript

Shared TypeScript configurations for vllnt projects. Scoped to `@vllnt` npm org.

## Publishing (local)

```sh
# 1. Auth (one-time, or when token expires)
npm login

# 2. Bump version (creates commit + tag)
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# 3. Publish
npm publish --access public

# 4. Push commit + tag to remote
git push && git push --tags
```

## Publishing (CI)

Push a version tag — CI handles the rest:

```sh
npm version patch
git push && git push --tags
# release.yml: npm publish --provenance → GitHub Release
```

Requires `NPM_TOKEN` secret in GitHub repo settings.

## Project structure

```
base.json          ← foundation (strict, isolatedModules, noUncheckedIndexedAccess)
nodejs.json        ← Node.js apps (NodeNext, ES2024)
node-library.json  ← publishable npm packages (NodeNext, ES2024, declarationMap)
react.json         ← React apps (Bundler, ES2022, react-jsx)
nextjs.json        ← Next.js apps (Bundler, ES2022, noEmit, next plugin)
```

## Commands

| Command | What |
|---------|------|
| `npm pack --dry-run` | Preview tarball contents |
| `npm view @vllnt/typescript` | Check published version |
