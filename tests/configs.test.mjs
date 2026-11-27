import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
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

/** @typedef {import("../scripts/test-utils.mjs").Compiler} Compiler */

const packageJson = loadJson(join(root, "package.json"));
// Presets set noEmit directly rather than inheriting it, so the raw file is enough.
const emittingPresets = presets.filter(
  (preset) => !loadJson(join(root, `${preset}.json`)).compilerOptions.noEmit,
);
// Each flag the base preset turns on, with the fixture that breaks that flag
// and the diagnostic the fixture must raise.
const strictFlags = {
  exactOptionalPropertyTypes: { code: "TS2375", file: "exact-optional.ts" },
  noFallthroughCasesInSwitch: { code: "TS7029", file: "fallthrough.ts" },
  noImplicitOverride: { code: "TS4114", file: "override.ts" },
  noImplicitReturns: { code: "TS7030", file: "implicit-return.ts" },
};
const flagFixtures = join(fixtures, "flags");
const flagSources = join(flagFixtures, "src");
const flagDiagnostics = Object.values(strictFlags)
  .map(({ code, file }) => `${file} ${code}`)
  .sort();
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
    /** @type {Record<string, Record<string, unknown>>} */
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
    const inheritedFlags = Object.fromEntries(
      Object.keys(strictFlags).map((flag) => [flag, true]),
    );

    for (const compiler of compilers) {
      for (const preset of presets) {
        const output = runCompiler(compiler, [
          "--project",
          join(fixtures, preset, "tsconfig.json"),
          "--showConfig",
        ]);
        expect(loadJsonFromOutput(output).compilerOptions).toMatchObject({
          ...inheritedFlags,
          ...expected[preset],
        });
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

  test.each(presets)(
    "%s reports the diagnostics of every stricter base flag and nothing else",
    (preset) => {
      expect(typeCheckFlagFixtures(compiler, preset)).toEqual(flagDiagnostics);
    },
  );

  test.each(Object.entries(strictFlags))(
    "%s alone is responsible for its diagnostic",
    (flag, { code, file }) => {
      expect(
        typeCheckFlagFixtures(compiler, "base", [`--${flag}`, "false"]),
      ).toEqual(flagDiagnostics.filter((entry) => entry !== `${file} ${code}`));
    },
  );

  test("the flags leave JavaScript unchanged, and inferred declarations can differ", () => {
    const withFlags = emitFlagFixtures(compiler);
    const withoutFlags = emitFlagFixtures(
      compiler,
      Object.keys(strictFlags).flatMap((flag) => [`--${flag}`, "false"]),
    );
    const declarations = "emit/declarations.d.ts";

    expect([...withFlags.keys()].sort()).toEqual([
      "emit/declarations.d.ts",
      "emit/declarations.js",
      "src/compliant.d.ts",
      "src/compliant.js",
    ]);
    expect([...withoutFlags.keys()].sort()).toEqual(
      [...withFlags.keys()].sort(),
    );
    for (const [file, content] of withFlags) {
      if (file !== declarations) {
        expect(withoutFlags.get(file), file).toBe(content);
      }
    }
    expect(withFlags.get(declarations)).toContain("count?: number;");
    expect(withoutFlags.get(declarations)).toContain(
      "count?: number | undefined;",
    );
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

  test.each(emittingPresets)(
    "%s emits on a clean build despite a leftover .tsbuildinfo",
    (preset) => {
      const project = mkdtempSync(join(tmpdir(), "vllnt-ts-clean-build-"));
      const tsconfig = join(project, "tsconfig.json");
      const outputDirectory = join(project, "dist");
      try {
        mkdirSync(join(project, "src"));
        writeFileSync(
          join(project, "src", "index.ts"),
          "export const value: number = 1;\n",
        );
        writeFileSync(
          tsconfig,
          JSON.stringify({
            // rootDir keeps the .tsbuildinfo in the project root, outside dist.
            compilerOptions: { outDir: "dist", rootDir: "src" },
            extends: join(root, `${preset}.json`),
            include: ["src"],
          }),
        );

        // An earlier incremental build leaves its .tsbuildinfo behind.
        runCompiler(compiler, ["--project", tsconfig, "--incremental"]);
        expect(readdirSync(project)).toContain("tsconfig.tsbuildinfo");
        const outputs = readdirSync(outputDirectory).sort();
        expect(outputs).toContain("index.js");

        // A rebuild after deleting the output directory must emit every file again.
        rmSync(outputDirectory, { force: true, recursive: true });
        runCompiler(compiler, ["--project", tsconfig]);
        expect(existsSync(outputDirectory), "the rebuild emitted nothing").toBe(
          true,
        );
        expect(readdirSync(outputDirectory).sort()).toEqual(outputs);
      } finally {
        rmSync(project, { force: true, recursive: true });
      }
    },
  );
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
    expect(
      pack.files.map((/** @type {{ path: string }} */ { path }) => path).sort(),
    ).toEqual([...expectedPackageFiles].sort());

    const consumer = join(temporaryRoot, "consumer");
    mkdirSync(consumer);
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({
        devDependencies: {
          "@vllnt/typescript": `file:${pack.filename}`,
        },
        packageManager: packageJson.packageManager,
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

/** @param {string} output */
function loadJsonFromOutput(output) {
  return JSON.parse(output);
}

// Emits the compliant fixture and the declaration fixture with the node-library
// preset and returns a map of "<path>" to content for every .js and .d.ts file.
/**
 * @param {Compiler} compiler
 * @param {string[]} [extraArguments]
 */
function emitFlagFixtures(compiler, extraArguments = []) {
  const project = mkdtempSync(join(tmpdir(), "vllnt-ts-flags-emit-"));
  try {
    const tsconfig = join(project, "tsconfig.json");
    const outputDirectory = join(project, "out");
    writeFileSync(
      tsconfig,
      JSON.stringify({
        compilerOptions: { outDir: outputDirectory, rootDir: flagFixtures },
        extends: join(root, "node-library.json"),
        files: [
          join(flagSources, "compliant.ts"),
          join(flagFixtures, "emit", "declarations.ts"),
        ],
      }),
    );
    runCompiler(compiler, ["--project", tsconfig, ...extraArguments]);
    return new Map(
      readdirSync(outputDirectory, { encoding: "utf8", recursive: true })
        .filter((file) => /\.(js|d\.ts)$/.test(file))
        .map((file) => [
          file.replaceAll("\\", "/"),
          readFileSync(join(outputDirectory, file), "utf8"),
        ]),
    );
  } finally {
    rmSync(project, { force: true, recursive: true });
  }
}

// Type-checks tests/fixtures/flags under a preset and returns the sorted
// "<file> <code>" of every diagnostic. A failure with no diagnostic (a bad
// config, a missing file) is rethrown so it cannot pass as "no errors".
/**
 * @param {Compiler} compiler
 * @param {string} preset
 * @param {string[]} [extraArguments]
 */
function typeCheckFlagFixtures(compiler, preset, extraArguments = []) {
  const project = mkdtempSync(join(tmpdir(), "vllnt-ts-flags-"));
  try {
    const tsconfig = join(project, "tsconfig.json");
    writeFileSync(
      tsconfig,
      JSON.stringify({
        compilerOptions: { noEmit: true },
        extends: join(root, `${preset}.json`),
        files: readdirSync(flagSources).map((name) => join(flagSources, name)),
      }),
    );
    try {
      runCompiler(compiler, [
        "--project",
        tsconfig,
        "--pretty",
        "false",
        ...extraArguments,
      ]);
      return [];
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      const diagnostics = [
        ...error.message.matchAll(/([^/\\]+)\(\d+,\d+\): error (TS\d+):/g),
      ].map(([, file, code]) => `${file} ${code}`);
      if (diagnostics.length === 0) {
        throw error;
      }
      return diagnostics.sort();
    }
  } finally {
    rmSync(project, { force: true, recursive: true });
  }
}
