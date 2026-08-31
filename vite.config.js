import { defineConfig } from "vite";

/* 개발 서버 전용 설정.

   이 프로젝트는 빌드 없이 저장소 파일을 그대로 배포한다(.github/workflows/deploy.yml).
   vite 는 오직 `npm run dev` 의 HMR — 파일을 저장하면 브라우저에 바로 반영 — 을 위해서만 쓴다.
   그래서 build 설정은 두지 않는다. */
export default defineConfig({
  server: {
    port: 5173,
    open: true, // 실행하면 브라우저 자동으로 열기
  },
  plugins: [
    {
      /* wiki.js 는 file:// 로 열었을 때도 동작하도록 일반 <script src> 로 넣었다.
         (type="module" 로 하면 file:// 에서 CORS 로 차단된다)
         일반 스크립트는 vite 의 모듈 그래프 밖이라 저장해도 아무 일이 없으므로,
         여기서 직접 새로고침 신호를 보낸다. CSS 는 vite 가 알아서 새로고침 없이 교체한다. */
      name: "wiki-reload-plain-scripts",
      handleHotUpdate({ file, server }) {
        if (file.endsWith(".js") && !file.includes("node_modules")) {
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
    },
  ],
});
