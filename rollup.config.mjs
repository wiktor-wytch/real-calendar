import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const isProduction = process.env.NODE_ENV !== "development";

export default {
  input: "main.ts",
  output: {
    file: "main.js",
    format: "cjs"
  },
  external: ["obsidian"],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: "./tsconfig.json" }),
    ...(isProduction ? [terser()] : [])
  ]
};

