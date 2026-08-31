import nodejs from "@vllnt/eslint-config/nodejs";

export default [
  {
    ignores: [
      "coverage/**",
      "node_modules/**",
      "tests/fixtures/**",
      "tests/integration/nextjs/next-env.d.ts",
      "tests/integration/**/.next/**",
      "tests/integration/**/dist/**",
    ],
  },
  ...nodejs,
  {
    files: ["scripts/**/*.mjs", "tests/**/*.mjs", "*.config.mjs"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "functional/no-loop-statements": "off",
      "max-lines-per-function": "off",
      "perfectionist/sort-objects": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    files: ["tests/integration/nextjs/**/*"],
    rules: {
      "@typescript-eslint/naming-convention": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
];
