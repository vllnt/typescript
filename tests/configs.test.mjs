import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

import { describe, expect, test } from "vitest";

import {
  compilers,
  fixtures,
  loadJson,
  presets,
  root,
  run,
  runCompiler,
} from "../scripts/test-utils.mjs";

const packageJson = loadJson(join(root, "package.json"));
const expectedPackageFiles = [
  "base.json",
  "CHANGELOG.md",
  "LICENSE",
  "llms.txt",
  "nextjs.json",
  "node-library.json",
  "nodejs.json",
  "package.json",
  "react.json",
  "README.md",
];

describe("public presets", () => {
  test("are valid, published, and derived from the base preset", () => {
    for (const preset of presets) {
      const filename = `${preset}.json`;
      const config = loadJson(join(root, filename));
      expect(config.compilerOptions).toBeTypeOf("object");
      expect(packageJson.files).toContain(filename);
      expect(packageJson.exports[`./${filename}`]).toBe(`./${filename}`);
      if (preset !== "base") {
        expect(config.extends).toBe("./base.json");
      }
    }
  });

  test("preserve the documented effective compiler options", () => {
    const expected = {
      base: { noUncheckedIndexedAccess: true, strict: true, types: [] },
      nextjs: { jsx: "preserve", moduleResolution: "bundler", noEmit: true },
      "node-library": {
        declaration: true,
        declarationMap: true,
        module: "nodenext",
        target: "es2024",
      },
      nodejs: { module: "nodenext", target: "es2024" },
      react: {
        jsx: "react-jsx",
        moduleResolution: "bundler",
        target: "es2022",
      },
    };

    for (const compiler of compilers) {
      for (const preset of presets) {
        const output = runCompiler(compiler, [
          "--project",
          join(fixtures, preset, "tsconfig.json"),
          "--showConfig",
        ]);
        expect(loadJsonFromOutput(output).compilerOptions).toMatchObject(
          expected[preset],
        );
      }
    }
  });
});

describe.each(compilers)("$label", (compiler) => {
  test("is the expected compiler major", () => {
    expect(runCompiler(compiler, ["--version"])).toMatch(
      compiler.versionPrefix,
    );
  });

  test("type-checks every preset fixture", () => {
    const buildInfoDirectory = mkdtempSync(
      join(tmpdir(), "vllnt-ts-build-info-"),
    );
    try {
      for (const preset of presets) {
        runCompiler(compiler, [
          "--project",
          join(fixtures, preset, "tsconfig.json"),
          "--noEmit",
          "--incremental",
          "--tsBuildInfoFile",
          join(buildInfoDirectory, `${preset}.tsbuildinfo`),
        ]);
      }
    } finally {
      rmSync(buildInfoDirectory, { force: true, recursive: true });
    }
  });

  test("preserves node-library emit behavior", () => {
    const outputDirectory = mkdtempSync(join(tmpdir(), "vllnt-ts-library-"));
    try {
      runCompiler(compiler, [
        "--project",
        join(fixtures, "node-library", "tsconfig.json"),
        "--outDir",
        outputDirectory,
      ]);
      expect(readdirSync(outputDirectory).sort()).toEqual([
        "index.d.ts",
        "index.d.ts.map",
        "index.js",
        "index.js.map",
      ]);
      expect(
        run(process.execPath, [
          "--eval",
          `const { double } = require(${JSON.stringify(join(outputDirectory, "index.js"))}); process.stdout.write(String(double(2)))`,
        ]),
      ).toBe("4");
    } finally {
      rmSync(outputDirectory, { force: true, recursive: true });
    }
  });
});

test("TypeScript 6 remains available to JavaScript API consumers", async () => {
  const typescript = await import("typescript");
  expect(typescript.version).toMatch(/^6\./);
  expect(typescript.createProgram).toBeTypeOf("function");
});

test("the package tarball has an exact public surface and resolves every preset", () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "vllnt-ts-package-"));
  try {
    const pack = JSON.parse(
      run("pnpm", ["pack", "--json", "--pack-destination", temporaryRoot]),
    );
    expect(pack.files.map(({ path }) => path).sort()).toEqual(
      [...expectedPackageFiles].sort(),
    );

    const consumer = join(temporaryRoot, "consumer");
    mkdirSync(consumer);
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        devDependencies: {
          "@vllnt/typescript": `file:${pack.filename}`,
        },
        packageManager: "pnpm@11.24.0",
        private: true,
      }),
    );
    run(
      "pnpm",
      ["install", "--ignore-scripts", "--config.auto-install-peers=false"],
      { cwd: consumer },
    );

    for (const preset of presets) {
      const project = join(consumer, preset);
      mkdirSync(project);
      writeFileSync(join(project, "index.ts"), "export const value = 1\n");
      writeFileSync(
        join(project, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: { noEmit: true },
          extends: `@vllnt/typescript/${preset}.json`,
          files: ["index.ts"],
        }),
      );
      runCompiler(compilers[1], ["--project", join(project, "tsconfig.json")], {
        cwd: consumer,
      });
    }
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
});

test("command failures retain actionable diagnostics", () => {
  expect(() =>
    run(process.execPath, ["--definitely-not-a-node-option"]),
  ).toThrow(/failed with status/);
  expect(() => run("vllnt-command-that-does-not-exist", [])).toThrow();
});

function loadJsonFromOutput(output) {
  return JSON.parse(output);
}
