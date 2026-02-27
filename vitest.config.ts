import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['tests/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/lib/grade.ts',
        'src/lib/insights.ts',
        'src/hooks/useQuizReducer.ts',
        'src/hooks/useTimer.ts',
        'src/hooks/useQuizKeyboard.ts',
        'src/lib/question-schema.ts',
      ],
      thresholds: {
        'src/lib/grade.ts': { lines: 100 },
        'src/lib/insights.ts': { lines: 95 },
        'src/hooks/useQuizReducer.ts': { lines: 90 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
