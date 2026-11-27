// Agent-first documentation contract: README layout, shipped-doc links, the
// llms.txt index, the ecosystem backlinks, and every README example and
// documented diagnostic checked against the packed package.
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  compilers,
  installPackedConsumer,
  loadJson,
  presets,
  root,
  runCompiler,
} from "../scripts/test-utils.mjs";

/**
 * @typedef {object} CodeBlock
 * @property {string} language
 * @property {string} content
 * @property {number} startLine 1-based line of the opening fence
 * @property {number} endLine 1-based line of the closing fence
 * @property {string} section the enclosing `## ` heading
 * @property {string} subsection the enclosing `### ` heading, or ""
 * @property {string | undefined} caption the `path` named by "`path`:" on the line before the block
 */

/**
 * @typedef {object} ErrorCase
 * @property {string} name
 * @property {{ ts6: string, ts7: string }} code
 * @property {string} preset
 * @property {Record<string, unknown>} compilerOptions
 * @property {Record<string, string>} files
 * @property {string} [extends] overrides `@vllnt/typescript/<preset>.json`
 * @property {boolean} [esm] adds `"type": "module"` to the project's package.json
 */

const packageJson = loadJson(join(root, "package.json"));
const shortName = packageJson.name.split("/")[1];
const readme = readFileSync(join(root, "README.md"), "utf8");
const llms = readFileSync(join(root, "llms.txt"), "utf8");
const readmeBlocks = codeBlocks(readme);

const requiredSections = [
  "For coding agents",
  "When to use",
  "Install",
  "Quick start",
  "API",
  "Common tasks",
  "Errors and fixes",
  "Limits and gotchas",
  "Compatibility",
  "Testing",
  "Security",
  "Related packages",
  "Contributing",
  "License",
];
const footer = [
  "---",
  "",
  `Part of [vllnt open source](https://oss.vllnt.com) · [Package page](https://oss.vllnt.com/packages/${shortName}) · [vllnt.com](https://vllnt.com) · Built by [bntvllnt](https://bntvllnt.com)`,
].join("\n");
const ecosystem = [
  "## Ecosystem",
  "",
  `- [Package page](https://oss.vllnt.com/packages/${shortName})`,
  "- [All @vllnt packages](https://oss.vllnt.com/llms.txt)",
  "- [vllnt](https://vllnt.com/llms.txt)",
  "- [Author](https://bntvllnt.com)",
].join("\n");

/** @param {string} ts6 @param {string} [ts7] */
const code = (ts6, ts7 = ts6) => ({ ts6, ts7 });
/** @type {ErrorCase[]} */
const errorCases = [
  {
    name: "extends without .json",
    code: code("TS6053"),
    preset: "nodejs",
    extends: "@vllnt/typescript/nodejs",
    compilerOptions: { noEmit: true },
    files: { "src/index.ts": "export const value = 1;\n" },
  },
  {
    name: "Node.js globals without types",
    code: code("TS2591"),
    preset: "nodejs",
    compilerOptions: { noEmit: true },
    files: { "src/index.ts": "export const directory = process.cwd();\n" },
  },
  {
    name: "emitting without rootDir",
    code: code("TS5011"),
    preset: "nodejs",
    compilerOptions: { outDir: "dist" },
    files: { "src/index.ts": "export const value = 1;\n" },
  },
  {
    name: "extensionless relative import in ESM",
    code: code("TS2835"),
    preset: "nodejs",
    esm: true,
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts": 'export { value } from "./value";\n',
      "src/value.ts": "export const value = 1;\n",
    },
  },
  {
    name: "module overridden under NodeNext",
    code: code("TS5110"),
    preset: "nodejs",
    compilerOptions: { module: "ESNext", noEmit: true },
    files: { "src/index.ts": "export const value = 1;\n" },
  },
  {
    name: "baseUrl",
    code: code("TS5101", "TS5102"),
    preset: "nodejs",
    compilerOptions: { baseUrl: ".", noEmit: true },
    files: { "src/index.ts": "export const value = 1;\n" },
  },
  ...[
    { moduleResolution: "node" },
    { target: "ES5" },
    { esModuleInterop: false },
  ].map((option) => ({
    name: `removed option ${JSON.stringify(option)}`,
    code: code("TS5107", "TS5108"),
    preset: "base",
    compilerOptions: { ...option, noEmit: true },
    files: { "src/index.ts": "export const value = 1;\n" },
  })),
  {
    name: "strict off with exactOptionalPropertyTypes on",
    code: code("TS5052"),
    preset: "base",
    compilerOptions: { noEmit: true, strict: false },
    files: { "src/index.ts": "export const value = 1;\n" },
  },
  {
    name: "JSX without a jsx setting",
    code: code("TS17004"),
    preset: "nodejs",
    compilerOptions: { noEmit: true },
    files: { "src/index.tsx": "export const element = <div />;\n" },
  },
  {
    name: "unresolved side-effect import",
    code: code("TS2882"),
    preset: "react",
    compilerOptions: { noEmit: true },
    files: { "src/index.ts": 'import "./styles.css";\n' },
  },
  {
    name: "unchecked index access",
    code: code("TS2532"),
    preset: "base",
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts":
        "const values: number[] = [];\nexport const text = values[0].toFixed();\n",
    },
  },
  {
    name: "missing override",
    code: code("TS4114"),
    preset: "base",
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts":
        "class Base {\n  run(): void {}\n}\nexport class Child extends Base {\n  run(): void {}\n}\n",
    },
  },
  {
    name: "implicit return",
    code: code("TS7030"),
    preset: "base",
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts":
        "export function sign(value: number): number | undefined {\n  if (value > 0) {\n    return 1;\n  }\n}\n",
    },
  },
  {
    name: "switch fallthrough",
    code: code("TS7029"),
    preset: "base",
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts":
        'export function label(value: number): string {\n  let text = "";\n  switch (value) {\n    case 1:\n      text = "one";\n    case 2:\n      text += "two";\n      break;\n  }\n  return text;\n}\n',
    },
  },
  ...[
    {
      name: "explicit undefined in an object",
      code: code("TS2375"),
      body: "export const options: Options = { name: undefined };\n",
    },
    {
      name: "explicit undefined in an argument",
      code: code("TS2379"),
      body: "declare function use(options: Options): void;\nuse({ name: undefined });\n",
    },
    {
      name: "explicit undefined in an assignment",
      code: code("TS2412"),
      body: "export const options: Options = {};\noptions.name = undefined;\n",
    },
  ].map(({ name, code: expected, body }) => ({
    name,
    code: expected,
    preset: "base",
    compilerOptions: { noEmit: true },
    files: {
      "src/index.ts": `interface Options {\n  name?: string;\n}\n${body}`,
    },
  })),
];

let consumer = "";
let packedFiles = /** @type {string[]} */ ([]);
let temporaryRoot = "";

beforeAll(() => {
  temporaryRoot = mkdtempSync(join(tmpdir(), "vllnt-ts-docs-"));
  ({ consumer, files: packedFiles } = installPackedConsumer(temporaryRoot, {
    "@types/node": packageJson.devDependencies["@types/node"],
    "@types/react": packageJson.devDependencies["@types/react"],
  }));
}, 240_000);

afterAll(() => {
  rmSync(temporaryRoot, { force: true, recursive: true });
});

describe("package metadata", () => {
  test("description is one sentence of at most 160 characters, shared by README and llms.txt", () => {
    const { description } = packageJson;
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/^[^.]+(\.[^\s.][^.]*)*\.$/);
    expect(description).not.toMatch(/vllnt projects/i);
    expect(readme.split("\n")[2]).toBe(description);
    expect(llms).toContain(`> ${description}`);
  });

  test("has 8 to 12 unique keywords", () => {
    const { keywords } = packageJson;
    expect(keywords.length).toBeGreaterThanOrEqual(8);
    expect(keywords.length).toBeLessThanOrEqual(12);
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  test("links the package page, author, funding and issues", () => {
    expect(packageJson.homepage).toBe(
      `https://oss.vllnt.com/packages/${shortName}`,
    );
    expect(packageJson.author).toEqual({
      name: "bntvllnt",
      url: "https://bntvllnt.com",
    });
    expect(packageJson.funding).toEqual({
      type: "github",
      url: "https://github.com/sponsors/bntvllnt",
    });
    expect(packageJson.bugs).toEqual({
      url: `https://github.com/vllnt/${shortName}/issues`,
    });
  });
});

describe("README layout", () => {
  test("has the required sections in order", () => {
    const headings = headingsOf(readme, 2);
    expect(
      headings.filter((heading) => requiredSections.includes(heading)),
    ).toEqual(requiredSections);
  });

  test("puts the install command and the quick start within the first 40 lines", () => {
    const install = readmeBlocks.find(({ section }) => section === "Install");
    expect(install?.content).toMatch(
      /^pnpm add --save-dev @vllnt\/typescript /,
    );
    const quickStart = readmeBlocks.filter(
      ({ section }) => section === "Quick start",
    );
    expect(quickStart.length).toBeGreaterThan(0);
    for (const block of [install, ...quickStart]) {
      expect(block?.endLine).toBeLessThanOrEqual(40);
    }
  });

  test("ends with the exact ecosystem footer", () => {
    expect(readme.trimEnd().endsWith(footer)).toBe(true);
  });

  test("documents every export in the API table and each preset's own options", () => {
    const api = sectionText(readme, "API");
    for (const key of Object.keys(packageJson.exports)) {
      expect(api).toContain(`| \`@vllnt/typescript/${key.slice(2)}\``);
    }
    for (const preset of presets) {
      const block = readmeBlocks.find(
        ({ section, subsection }) =>
          section === "API" && subsection === `${preset}.json`,
      );
      expect(block, `### ${preset}.json`).toBeDefined();
      expect(JSON.parse(block?.content ?? "")).toEqual(
        loadJson(join(root, `${preset}.json`)).compilerOptions,
      );
    }
  });

  test("lists exactly the diagnostics that tests reproduce", () => {
    const documented = new Set(
      sectionText(readme, "Errors and fixes")
        .split("\n")
        .filter((line) => /^\| TS\d/.test(line))
        .flatMap((line) => line.split("|")[1]?.match(/TS\d+/g) ?? []),
    );
    const reproduced = new Set(
      errorCases.flatMap(({ code: { ts6, ts7 } }) => [ts6, ts7]),
    );
    expect([...documented].sort()).toEqual([...reproduced].sort());
  });
});

describe("shipped docs", () => {
  test("every code block has a language tag and no elided parts", () => {
    for (const file of docFiles()) {
      for (const block of codeBlocks(readFileSync(join(root, file), "utf8"))) {
        expect(block.language, `${file}:${block.startLine}`).not.toBe("");
        expect(block.content, `${file}:${block.startLine}`).not.toMatch(
          /\.\.\.|…/,
        );
        if (block.language === "json") {
          expect(
            () => JSON.parse(block.content),
            `${file}:${block.startLine}`,
          ).not.toThrow();
        }
      }
    }
  });

  test("every relative link and anchor resolves inside the package", () => {
    const broken = [];
    for (const file of docFiles()) {
      const text = readFileSync(join(root, file), "utf8");
      for (const [, target = ""] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^[a-z]+:/i.test(target)) {
          continue;
        }
        const [path = "", anchor] = target.split("#");
        const resolved = path === "" ? file : join(dirname(file), path);
        if (!packedFiles.includes(resolved.replace(/^\.\//, ""))) {
          broken.push(`${file}: ${target} (not packed)`);
        } else if (
          anchor !== undefined &&
          !anchorsOf(readFileSync(join(root, resolved), "utf8")).includes(
            anchor,
          )
        ) {
          broken.push(`${file}: ${target} (no such heading)`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  test("llms.txt has the summary, when-to-use, reference links and the ecosystem block", () => {
    expect(llms).toContain("## When to use");
    expect(llms).toContain("](./README.md#api)");
    expect(llms).toContain("](./README.md#errors-and-fixes)");
    expect(llms.trimEnd().endsWith(ecosystem)).toBe(true);
    expect(llms.split("https://oss.vllnt.com/llms.txt").length - 1).toBe(1);
  });

  test("no packed file mentions vllnt.ai", () => {
    for (const file of packedFiles) {
      expect(readFileSync(join(root, file), "utf8"), file).not.toMatch(
        /vllnt\.ai/i,
      );
    }
  });
});

describe.each(compilers)("README examples with $label", (compiler) => {
  const groups = exampleGroups();

  test.each(groups)("$name", (group) => {
    const project = join(consumer, `${compiler.binary}-${slug(group.name)}`);
    for (const [file, content] of Object.entries(group.files)) {
      mkdirSync(dirname(join(project, file)), { recursive: true });
      writeFileSync(join(project, file), content);
    }
    const tsconfig = join(project, "tsconfig.json");
    runCompiler(compiler, ["--project", tsconfig, "--showConfig"]);
    const expected = Object.entries(group.files).flatMap(([file, content]) =>
      content
        .split("\n")
        .flatMap((line, index) =>
          line.includes("// error") ? [`${file}:${index + 1}`] : [],
        ),
    );
    expect(diagnosticLocations(compiler, tsconfig)).toEqual(expected);
    const { outDir } = loadJson(tsconfig).compilerOptions ?? {};
    if (outDir) {
      expect(readdirSync(join(project, outDir)).length).toBeGreaterThan(0);
    }
  });
});

describe.each(compilers)("documented diagnostics with $label", (compiler) => {
  test.each(errorCases)("$name", (errorCase) => {
    const project = join(
      consumer,
      `${compiler.binary}-error-${slug(errorCase.name)}`,
    );
    for (const [file, content] of Object.entries(errorCase.files)) {
      mkdirSync(dirname(join(project, file)), { recursive: true });
      writeFileSync(join(project, file), content);
    }
    if (errorCase.esm) {
      writeFileSync(join(project, "package.json"), '{"type":"module"}');
    }
    writeFileSync(
      join(project, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: errorCase.compilerOptions,
        extends:
          errorCase.extends ?? `@vllnt/typescript/${errorCase.preset}.json`,
        include: ["src"],
      }),
    );
    const expected =
      compiler.binary === "tsc6" ? errorCase.code.ts6 : errorCase.code.ts7;
    expect(compilerOutput(compiler, join(project, "tsconfig.json"))).toContain(
      `error ${expected}:`,
    );
  });
});

/**
 * Fenced code blocks of a Markdown document with their location.
 * @param {string} text
 * @returns {CodeBlock[]}
 */
function codeBlocks(text) {
  const lines = text.split("\n");
  /** @type {CodeBlock[]} */
  const blocks = [];
  let section = "";
  let subsection = "";
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (line.startsWith("## ")) {
      section = line.slice(3);
      subsection = "";
    } else if (line.startsWith("### ")) {
      subsection = line.slice(4);
    }
    if (!line.startsWith("```")) {
      continue;
    }
    const startLine = index + 1;
    let previous = index - 1;
    while (previous >= 0 && lines[previous]?.trim() === "") {
      previous--;
    }
    const caption = lines[previous]?.match(/`([^`]+)`:\s*$/)?.[1];
    const content = [];
    index++;
    while (index < lines.length && !lines[index]?.startsWith("```")) {
      content.push(lines[index]);
      index++;
    }
    blocks.push({
      caption,
      content: content.join("\n"),
      endLine: index + 1,
      language: line.slice(3).trim(),
      section,
      startLine,
      subsection,
    });
  }
  return blocks;
}

/**
 * README examples outside the API reference, grouped by heading into projects.
 * A block named by a "`path`:" caption goes to that path; an uncaptioned
 * `ts` block becomes src/index.ts. Groups without a tsconfig.json type-check
 * with base.json; groups without a source file get src/index.ts.
 */
function exampleGroups() {
  /** @type {Map<string, Record<string, string>>} */
  const groups = new Map();
  for (const block of readmeBlocks) {
    if (
      block.section === "API" ||
      !["json", "ts", "tsx"].includes(block.language)
    ) {
      continue;
    }
    const name = [block.section, block.subsection].filter(Boolean).join(" / ");
    const file =
      block.caption ??
      (block.language === "json" ? "tsconfig.json" : "src/index.ts");
    const group = groups.get(name) ?? {};
    group[file] = `${block.content}\n`;
    groups.set(name, group);
  }
  return [...groups]
    .filter(([, files]) =>
      Object.keys(files).some((file) => file !== "package.json"),
    )
    .map(([name, files]) => ({
      name,
      files: {
        ...(Object.keys(files).some((file) => /\.tsx?$/.test(file))
          ? {}
          : { "src/index.ts": "export const value: number = 1;\n" }),
        ...(files["tsconfig.json"]
          ? {}
          : {
              "tsconfig.json": JSON.stringify({
                compilerOptions: { noEmit: true },
                extends: "@vllnt/typescript/base.json",
                include: ["src"],
              }),
            }),
        ...files,
      },
    }));
}

/** @param {string} text @param {number} level */
function headingsOf(text, level) {
  const prefix = `${"#".repeat(level)} `;
  return codeFree(text)
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

/** @param {string} text @param {string} heading */
function sectionText(text, heading) {
  const lines = codeFree(text);
  const start = lines.indexOf(`## ${heading}`);
  const end = lines.findIndex(
    (line, index) => index > start && line.startsWith("## "),
  );
  return lines.slice(start, end === -1 ? undefined : end).join("\n");
}

/** Lines outside fenced code blocks. @param {string} text */
function codeFree(text) {
  let inside = false;
  return text.split("\n").filter((line) => {
    if (line.startsWith("```")) {
      inside = !inside;
      return false;
    }
    return !inside;
  });
}

/** Anchors of every heading. @param {string} text */
function anchorsOf(text) {
  return codeFree(text)
    .filter((line) => /^#{1,6} /.test(line))
    .map((line) => slug(line.replace(/^#+ /, "")));
}

/** GitHub-style heading anchor. @param {string} heading */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, "")
    .replaceAll(/\s/g, "-");
}

/** Shipped Markdown and text documents. */
function docFiles() {
  return packedFiles.filter((file) => /\.(md|txt)$/i.test(file));
}

/** @param {import("../scripts/test-utils.mjs").Compiler} compiler @param {string} tsconfig */
function compilerOutput(compiler, tsconfig) {
  try {
    runCompiler(compiler, ["--project", tsconfig, "--pretty", "false"], {
      cwd: dirname(tsconfig),
    });
    return "";
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }
    return error.message;
  }
}

/**
 * "<file>:<line>" of every diagnostic, relative to the project directory.
 * @param {import("../scripts/test-utils.mjs").Compiler} compiler
 * @param {string} tsconfig
 */
function diagnosticLocations(compiler, tsconfig) {
  const output = compilerOutput(compiler, tsconfig);
  const locations = [
    ...output.matchAll(/^(\S+?)\((\d+),\d+\): error TS\d+/gm),
  ].map(([, file = "", line]) => `${file.replaceAll("\\", "/")}:${line}`);
  if (output !== "" && locations.length === 0) {
    throw new Error(output);
  }
  return locations;
}
