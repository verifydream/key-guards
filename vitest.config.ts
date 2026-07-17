import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import swc from 'unplugin-swc'

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
    swc.vite({
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    }),
  ],
  test: {
    environment: 'node', // Use node environment for server/lib tests
    include: ['**/*.test.ts', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/app/api/scan/**', 'src/app/api/keys/route.ts', 'src/middleware.ts'],
      exclude: [
        'src/components/ui/**',
        'src/**/*.d.ts',
        'src/**/layout.tsx',
        'src/**/page.tsx',
      ],
      thresholds: {
        lines: 80,
      }
    },
  },
})
