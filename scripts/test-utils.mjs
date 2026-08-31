import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const fixtures = join(root, "tests", "fixtures");
export const presets = ["base", "nextjs", "node-library", "nodejs", "react"];
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

export function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function compilerPath(compiler) {
  const packagePath = require.resolve(`${compiler.packageName}/package.json`);
  const packageJson = loadJson(packagePath);
  return join(dirname(packagePath), packageJson.bin[compiler.binary]);
}

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

export function runCompiler(compiler, args, options) {
  return run(process.execPath, [compilerPath(compiler), ...args], options);
}
