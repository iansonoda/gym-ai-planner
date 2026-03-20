import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  test: {
    fileParallelism: false,
    include: [
      "src/**/*.unit.test.ts",
      "src/**/*.unit.test.tsx",
      "server/src/**/*.unit.test.ts",
      "server/src/**/*.integration.test.ts",
      "server/src/**/*.perf.test.ts",
    ],
    environment: "node",
    setupFiles: ["./test/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./test-results/coverage",
      include: ["src/**/*.{ts,tsx}", "server/src/**/*.ts"],
      exclude: [
        "src/main.tsx",
        "src/**/*.d.ts",
        "server/src/index.ts",
      ],
    },
  },
})
