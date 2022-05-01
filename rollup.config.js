import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const config = [
  {
    input: 'src/content/index.ts',
    output: { file: 'dist/content.js', format: 'iife' },
    plugins: [postcss(), terser(), typescript()],
  },
  {
    input: 'src/background/index.ts',
    output: { file: 'dist/background.js', format: 'iife' },
    plugins: [terser(), typescript()],
  },
]

export default config
