const { test } = require('node:test')
const assert = require('node:assert/strict')
const { mkdtempSync, readFileSync, readdirSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { dirname, join } = require('node:path')
const { spawnSync } = require('node:child_process')

const root = join(__dirname, '..')
const fixtures = join(__dirname, 'fixtures')

const configs = readdirSync(root).filter(
  (file) =>
    file.endsWith('.json') &&
    file !== 'package.json' &&
    file !== 'package-lock.json',
)

const compilers = [
  {
    binary: 'tsc6',
    label: 'TypeScript 6',
    packageName: 'typescript',
    versionPrefix: 'Version 6.',
  },
  {
    binary: 'tsc',
    label: 'TypeScript 7',
    packageName: '@typescript/native',
    versionPrefix: 'Version 7.',
  },
]

function compilerPath(compiler) {
  const packagePath = require.resolve(`${compiler.packageName}/package.json`)
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))
  return join(dirname(packagePath), packageJson.bin[compiler.binary])
}

function runCompiler(compiler, args) {
  const result = spawnSync(process.execPath, [compilerPath(compiler), ...args], {
    cwd: root,
    encoding: 'utf-8',
    timeout: 30_000,
  })
  assert.equal(
    result.error,
    undefined,
    `${compiler.label} could not run: ${result.error?.message}`,
  )
  assert.equal(
    result.status,
    0,
    `${compiler.label} failed (${args.join(' ')}):\n${result.stdout}${result.stderr}`,
  )
  return result.stdout.trim()
}

test('all config files are valid JSON with compilerOptions', () => {
  for (const config of configs) {
    const raw = readFileSync(join(root, config), 'utf-8')
    const parsed = JSON.parse(raw)
    assert.ok(parsed.compilerOptions, `${config} must have compilerOptions`)
    assert.equal(typeof parsed.compilerOptions, 'object')
  }
})

test('derived configs extend base.json', () => {
  const derived = configs.filter((c) => c !== 'base.json')
  for (const config of derived) {
    const raw = readFileSync(join(root, config), 'utf-8')
    const parsed = JSON.parse(raw)
    assert.equal(parsed.extends, './base.json', `${config} must extend base.json`)
  }
})

test('package.json files array includes all configs', () => {
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
  for (const config of configs) {
    assert.ok(pkg.files.includes(config), `${config} must be in package.json files`)
  }
})

test('integration tests use the supported compiler majors', () => {
  for (const compiler of compilers) {
    assert.ok(
      runCompiler(compiler, ['--version']).startsWith(compiler.versionPrefix),
      `${compiler.label} must report ${compiler.versionPrefix}`,
    )
  }
})

test('TypeScript 6 compatibility package exposes the JavaScript API', () => {
  const typescript = require('typescript')
  assert.match(typescript.version, /^6\./)
  assert.equal(typeof typescript.createProgram, 'function')
})

for (const compiler of compilers) {
  test(`${compiler.label} type-checks every preset fixture`, () => {
    const buildInfoDirectory = mkdtempSync(
      join(tmpdir(), 'vllnt-typescript-build-info-'),
    )
    try {
      for (const preset of configs.map((config) => config.replace('.json', ''))) {
        runCompiler(compiler, [
          '--project',
          join(fixtures, preset, 'tsconfig.json'),
          '--noEmit',
          '--incremental',
          '--tsBuildInfoFile',
          join(buildInfoDirectory, `${preset}.tsbuildinfo`),
        ])
      }
    } finally {
      rmSync(buildInfoDirectory, { force: true, recursive: true })
    }
  })

  test(`${compiler.label} preserves node-library emit behavior`, () => {
    const outputDirectory = mkdtempSync(
      join(tmpdir(), 'vllnt-typescript-node-library-'),
    )
    try {
      runCompiler(compiler, [
        '--project',
        join(fixtures, 'node-library', 'tsconfig.json'),
        '--outDir',
        outputDirectory,
      ])

      for (const output of [
        'index.js',
        'index.js.map',
        'index.d.ts',
        'index.d.ts.map',
      ]) {
        assert.ok(
          readdirSync(outputDirectory).includes(output),
          `${compiler.label} must emit ${output} for node-library.json`,
        )
      }
    } finally {
      rmSync(outputDirectory, { force: true, recursive: true })
    }
  })
}
