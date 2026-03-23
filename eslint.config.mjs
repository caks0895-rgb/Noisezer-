import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "build/**", "public/**"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/triple-slash-reference": "off"
    }
  }
];
