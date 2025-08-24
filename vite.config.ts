import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite'; // named import
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwind from '@tailwindcss/vite'; // keep only if you’re using Tailwind

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths(), tailwind()],
  test: { environment: 'jsdom' },
});
