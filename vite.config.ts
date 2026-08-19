import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages는 https://<user>.github.io/<repo>/ 하위 경로로 서비스되므로 base가 필요하다.
// vite dev만 루트로 띄우고, build와 preview는 같은 base를 쓴다.
// vite는 preview에도 command === 'serve'를 주기 때문에 argv로 구분한다.
// 이렇게 하지 않으면 preview 서버가 루트로 뜨는데 빌드된 HTML은 /kr-party-policy/를
// 가리켜서, 빌드 결과를 미리 볼 수 없다.
const BASE = '/kr-party-policy/';

export default defineConfig(({ command }) => {
  const isPreview = process.argv.includes('preview');
  return {
    base: command === 'serve' && !isPreview ? '/' : BASE,
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsInlineLimit: 0
    }
  };
});
