import fs from "node:fs";
import path from "node:path";
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
      /* docs/*.html 은 완성된 페이지가 아니라 .layout 안에 꽂히는 조각이다.
         vite 는 .html 을 페이지로 보고 <script src="/@vite/client"> 를 끼워 넣는데,
         그러면 그 태그가 문서 본문 안으로 딸려 들어간다. 그래서 원본 그대로 내보낸다.
         (배포 환경에는 vite 가 없으므로 이 문제 자체가 없다) */
      name: "wiki-raw-doc-fragments",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const m = req.url?.match(/^\/docs\/([\w.-]+\.html)(?:\?|$)/);
          if (!m) return next();

          const file = path.join(server.config.root, "docs", m[1]);
          if (!fs.existsSync(file)) return next();

          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(fs.readFileSync(file));
        });
      },
    },
    {
      /* wiki 의 스크립트는 file:// 호환을 위해 일반 <script> 로도 쓸 수 있게 두었다.
         모듈 그래프 밖의 파일이 바뀌어도 새로고침이 걸리도록 신호를 보낸다.
         CSS 는 vite 가 알아서 새로고침 없이 교체한다. */
      name: "wiki-reload-plain-scripts",
      handleHotUpdate({ file, server }) {
        if (file.endsWith(".html") && file.includes("/docs/")) {
          server.ws.send({ type: "full-reload" });
          return [];
        }
      },
    },
  ],
});
