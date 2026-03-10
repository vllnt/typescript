const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync, readdirSync } = require('node:fs')
const { join } = require('node:path')

const root = join(__dirname, '..')

const configs = readdirSync(root).filter(
  (f) => f.endsWith('.json') && f !== 'package.json',
)

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
