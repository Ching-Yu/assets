
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // 在 AI Studio 環境中，有時 '/' 比 './' 更穩定
    base: '/', 
    server: {
      // 確保 HMR 正常運作
      host: true,
      strictPort: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    },
  };
});
