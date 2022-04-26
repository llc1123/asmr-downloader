import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import del from 'rollup-plugin-delete'
import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const config = [
  {
    input: 'src/content/index.ts',
    output: { file: 'dist/content.js', format: 'iife' },
    plugins: [del({ targets: 'dist/*' }), postcss(), terser(), typescript()],
  },
  {
    input: 'src/background/index.ts',
    output: { file: 'dist/background.js', format: 'iife' },
    plugins: [terser(), typescript()],
  },
  {
    input: 'src/download/index.ts',
    output: { file: 'dist/download.js', format: 'iife' },
    plugins: [nodeResolve(), commonjs(), terser(), typescript()],
  },
]

export default config
