import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Environnement navigateur simulé pour les composants React
    environment: 'jsdom',
    // Chargement du setup jest-dom avant chaque fichier de test
    setupFiles: ['./vitest.setup.ts'],
    // Convention : tous les tests dans __tests__/
    include: ['__tests__/**/*.test.{ts,tsx}'],
    // Exclure node_modules et .next
    exclude: ['node_modules', '.next'],
    globals: true,
    // Ne pas échouer si aucun test n'est encore écrit
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**', 'hooks/**', 'components/**'],
      exclude: [
        'components/ui/**', // primitives Shadcn, pas à tester
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
  resolve: {
    alias: {
      // Aligné sur tsconfig.json : "@/*" → "./*"
      '@': path.resolve(__dirname, '.'),
    },
  },
});
