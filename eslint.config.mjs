import obsidianmd from "eslint-plugin-obsidianmd";
import tseslint from "typescript-eslint";

// Manually enable all obsidian rules since recommended uses old format
const allRules = {};
for (const ruleName of Object.keys(obsidianmd.rules || {})) {
  allRules[`obsidianmd/${ruleName}`] = "error";
}

export default [
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      obsidianmd: obsidianmd,
    },
    rules: allRules,
  },
];
