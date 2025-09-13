// eslint.config.mjs
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    // 2. ADICIONAMOS A CONFIGURAÇÃO DO PLUGIN
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "react/react-in-jsx-scope": "off", // Já não é necessário com React 17+
      "no-unused-vars": "off", // Desligamos a regra base para usar a do plugin
      "@typescript-eslint/no-unused-vars": "warn", // Avisa sobre variáveis não usadas
      "unused-imports/no-unused-imports": "warn", // Avisa sobre imports não usados
      "unused-imports/no-unused-vars": [
        // Configuração mais detalhada
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
