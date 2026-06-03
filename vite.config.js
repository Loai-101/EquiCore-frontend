import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lock project root to this folder so `/src/main.jsx` always resolves,
 * even if Vite is spawned with a different cwd.
 */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
});
