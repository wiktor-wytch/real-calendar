const resolve = require('@rollup/plugin-node-resolve').default;
const commonjs = require('@rollup/plugin-commonjs');
const { terser } = require('rollup-plugin-terser');
const typescript = require('@rollup/plugin-typescript');

module.exports = {
  input: 'main.ts',
  output: {
    file: 'main.js',
    format: 'cjs'
  },
  external: ['obsidian'], // <-- tell Rollup not to bundle obsidian
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser()
  ]
};

