const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
    {
        ignores: ["node_modules/**", "out/**", "unpacked_vsix/**", "vsix/**"],
        linterOptions: {
            reportUnusedDisableDirectives: false
        }
    },
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module"
        },
        plugins: {
            "@typescript-eslint": tsPlugin
        },
        rules: {}
    }
];