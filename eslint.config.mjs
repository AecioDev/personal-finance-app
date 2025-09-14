// eslint.config.mjs
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "eslint-config-next";

export default [
  {
    ignores: ["node_modules/", ".next/", "dist/", "build/", "out/", "*.log"],
  },
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin,
  {
    ...pluginReactConfig,
    plugins: {
      react: pluginReact,
      "unused-imports": unusedImports,
    },
    rules: {
      ...pluginReactConfig.rules,

      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
