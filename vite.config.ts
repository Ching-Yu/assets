
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './', // Ensures assets are linked relatively so it works on any path
    define: {
      // Allows using process.env.API_KEY in the code by replacing it with the build-time value
      // If env.API_KEY is undefined, default to an empty string to prevent runtime crashes
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
  };
});
