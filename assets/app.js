/* ============================================================
   app.js — 조립과 라우팅

   문서 주소는 ?doc=<슬러그> 다. 링크를 누르면 새로고침 없이 본문만 갈아끼우고,
   주소창은 History API 로 맞춰 둔다. 그래서 주소를 그대로 붙여넣거나
   뒤로 가기를 눌러도 같은 문서가 열린다.

   경로에 슬러그를 넣지 않고 쿼리로 둔 이유:
   GitHub Pages 는 없는 경로를 404 로 돌려주기 때문에 /cuzky 같은 주소는 직접
   열 수 없다. ?doc=cuzky 는 언제나 index.html 이 응답한다.
   ============================================================ */

import { SITE, DOCS, HOME } from "./docs.js";
import { Header, DocHead, Rail } from "./components.js";
import { initGlobal, initDocument } from "./wiki.js";
import { SuggestDialog, initSuggest, setSuggestDoc } from "./suggest.js";

const headerEl = document.getElementById("site-header");
const articleEl = document.getElementById("doc");
const railEl = document.getElementById("rail");

const siteName = SITE.name + SITE.nameAccent;

/* 한 번 읽은 문서는 다시 읽지 않는다. */
const cache = new Map();

function slugFromUrl() {
  const s = new URLSearchParams(location.search).get("doc");
  return DOCS[s] ? s : HOME;
}

async function loadBody(doc) {
  if (cache.has(doc.file)) return cache.get(doc.file);

  const res = await fetch(doc.file);
  if (!res.ok) throw new Error(`${doc.file} (HTTP ${res.status})`);

  const html = await res.text();
  cache.set(doc.file, html);
  return html;
}

async function render(slug, { keepScroll = false } = {}) {
  const doc = DOCS[slug];
  document.title = `${doc.title} - ${siteName}`;

  let body;
  try {
    body = await loadBody(doc);
  } catch (err) {
    articleEl.innerHTML = `
      <h1 class="title">문서를 불러오지 못했습니다</h1>
      <p class="note">${err.message}</p>
      <p>파일을 직접 연 것이라면 개발 서버로 열어 주세요 — <code>npm run dev</code></p>`;
    railEl.innerHTML = "";
    return;
  }

  articleEl.innerHTML = DocHead(doc) + `<div class="layout">${body}</div>`;
  railEl.innerHTML = Rail(slug);

  initDocument();
  setSuggestDoc(slug); // 제안 메일에 어느 문서인지 담기 위해

  /* 주소에 #앵커가 붙어 있으면 그 문단으로, 아니면 문서 맨 위로. */
  if (location.hash) {
    document
      .getElementById(decodeURIComponent(location.hash.slice(1)))
      ?.scrollIntoView({ block: "start" });
  } else if (!keepScroll) {
    window.scrollTo(0, 0);
  }
}

/* ---------- 링크 가로채기 ---------- */
document.addEventListener("click", (e) => {
  const a = e.target.closest?.('a[href^="?doc="]');
  if (!a) return;
  /* 새 탭으로 열려는 클릭은 브라우저에 맡긴다. */
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

  e.preventDefault();
  const href = a.getAttribute("href");
  const slug = new URLSearchParams(href.slice(1)).get("doc");
  if (!DOCS[slug]) return;

  if (slug === slugFromUrl() && !location.hash) return; // 같은 문서면 아무것도 안 한다
  history.pushState({ slug }, "", href);
  render(slug);
});

window.addEventListener("popstate", () => render(slugFromUrl(), { keepScroll: true }));

/* ---------- 시작 ---------- */
headerEl.innerHTML = Header();
document.body.insertAdjacentHTML("beforeend", SuggestDialog());
initGlobal();
initSuggest();
render(slugFromUrl(), { keepScroll: true });
