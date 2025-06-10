import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/content/index.js',
  output: {
    file: 'dist/content.js',
    format: 'iife'
  },
  plugins: [nodeResolve()]
};
