import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/**
 * @typedef {object} Compiler
 * @property {string} binary
 * @property {string} label
 * @property {string} packageName
 * @property {string} versionPrefix
 */

/**
 * @typedef {object} RunOptions
 * @property {string} [cwd]
 * @property {number} [timeout]
 */

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const fixtures = join(root, "tests", "fixtures");
export const presets = ["base", "nextjs", "node-library", "nodejs", "react"];
/** @type {[Compiler, Compiler]} TypeScript 6, then TypeScript 7. */
export const compilers = [
  {
    binary: "tsc6",
    label: "TypeScript 6",
    packageName: "typescript",
    versionPrefix: "Version 6.",
  },
  {
    binary: "tsc",
    label: "TypeScript 7",
    packageName: "@typescript/native",
    versionPrefix: "Version 7.",
  },
];

/**
 * @param {string} path
 * @returns {any}
 */
export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** @param {Compiler} compiler */
export function compilerPath(compiler) {
  const packagePath = require.resolve(`${compiler.packageName}/package.json`);
  const packageJson = loadJson(packagePath);
  return join(dirname(packagePath), packageJson.bin[compiler.binary]);
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {RunOptions} [options]
 */
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: "utf8",
    timeout: options.timeout ?? 60_000,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}:\n${result.stdout}${result.stderr}`,
    );
  }

  return result.stdout.trim();
}

/**
 * @param {Compiler} compiler
 * @param {string[]} args
 * @param {RunOptions} [options]
 */
export function runCompiler(compiler, args, options) {
  return run(process.execPath, [compilerPath(compiler), ...args], options);
}

/**
 * Packs this package into `directory` and installs the tarball, plus any
 * `devDependencies`, in a new `directory/consumer` project.
 * @param {string} directory
 * @param {Record<string, string>} [devDependencies]
 * @returns {{ consumer: string, files: string[] }}
 */
export function installPackedConsumer(directory, devDependencies = {}) {
  const pack = JSON.parse(
    run("pnpm", ["pack", "--json", "--pack-destination", directory]),
  );
  const consumer = join(directory, "consumer");
  mkdirSync(consumer);
  // Without a workspace file the install ignores the repo's release-age policy.
  copyFileSync(
    join(root, "pnpm-workspace.yaml"),
    join(consumer, "pnpm-workspace.yaml"),
  );
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({
      devDependencies: {
        "@vllnt/typescript": `file:${pack.filename}`,
        ...devDependencies,
      },
      packageManager: loadJson(join(root, "package.json")).packageManager,
      private: true,
    }),
  );
  run(
    "pnpm",
    ["install", "--ignore-scripts", "--config.auto-install-peers=false"],
    { cwd: consumer, timeout: 180_000 },
  );
  return {
    consumer,
    files: pack.files.map((/** @type {{ path: string }} */ { path }) => path),
  };
}
