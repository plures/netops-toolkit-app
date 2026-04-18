import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sveltePlugin from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import globals from "globals";

let designDojoConfig = [];
try {
  const designDojoPlugin = await import("@plures/design-dojo/enforce");
  if (designDojoPlugin?.default?.configs?.recommended) {
    designDojoConfig = [designDojoPlugin.default.configs.recommended];
  }
} catch {
  designDojoConfig = [];
}

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs["flat/recommended"],
  ...designDojoConfig,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
      "no-control-regex": "off",
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "svelte/require-each-key": "off",
      "svelte/no-unused-svelte-ignore": "off",
      "svelte/prefer-svelte-reactivity": "off",
      "svelte/no-at-html-tags": "off",
      "svelte/no-useless-children-snippet": "off",
      "svelte/no-navigation-without-resolve": "off",
      "no-import-assign": "off",
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", ".svelte-kit/**", "build/**", "coverage/**"],
  },
);
