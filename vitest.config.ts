import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@conectores_cielo/cielo-applepay-headless-vtex-core': path.resolve(
        __dirname,
        'packages/applepay-core/src/index.ts'
      ),
      '@conectores_cielo/cielo-applepay-headless-vtex-adapter': path.resolve(
        __dirname,
        'packages/applepay-adapter-vtex/src/index.ts'
      ),
      '@conectores_cielo/cielo-applepay-headless-vtex-react': path.resolve(
        __dirname,
        'packages/applepay-react/src/index.ts'
      ),
    },
  },
})
