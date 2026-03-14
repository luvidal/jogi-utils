import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ratelimit: 'src/ratelimit.ts',
    sse: 'src/sse.ts',
    jwt: 'src/jwt.ts',
    apihandler: 'src/apihandler.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['next', 'jose'],
  treeshake: true,
})
