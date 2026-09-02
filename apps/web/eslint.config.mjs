import next from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "src/components/ui/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Patrones legítimos de sincronización (hydration guard, cerrar UI al navegar).
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
