import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*'],
      exclude: ['src/lib/**/__tests__/*'],
    },
    // Configuration pour les alias de modules
    alias: {
      '@/*': '<rootDir>/src/*',
    },
    // Timeout pour les tests asynchrones
    testTimeout: 10000,    
    // Ne pas arrêter au premier échec
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
