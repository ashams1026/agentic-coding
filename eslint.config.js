import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["**/dist/", "**/node_modules/", "**/*.js", "!eslint.config.js"] },

  // Base: all TypeScript files
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Frontend-specific: React hooks + refresh
  {
    files: ["packages/frontend/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Backend-specific: Node globals
  {
    files: ["packages/backend/src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Disable rules that conflict with Prettier (must be last)
  prettier,
);
