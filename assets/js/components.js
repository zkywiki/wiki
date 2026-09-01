/* ============================================================
   components.js — 화면 조각들

   각 함수는 HTML 문자열을 돌려준다. app.js 가 이걸 자리에 꽂는다.
   문서 본문을 뺀 나머지 화면(헤더, 우측 박스, 문서 머리말)이 여기 모여 있다.
   ============================================================ */

import { SITE, DOCS } from "./docs.js";

/* 문자열을 HTML 에 그대로 넣어도 안전하게. 등록부 값이 그대로 들어가므로 항상 통과시킨다. */
export function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

/* 문서 주소 — 라우터가 가로채는 형식이어야 한다. */
export function docHref(slug) {
  return "?doc=" + encodeURIComponent(slug);
}

/* ---------- 상단 헤더 ---------- */
export function Header() {
  return `
    <div class="topbar-inner">
      <a class="brand" href="${docHref("cuzky")}"
        >${esc(SITE.name)}<span>${esc(SITE.nameAccent)}</span></a
      >
      <div class="search">
        <input id="q" placeholder="${esc(SITE.searchPlaceholder)}" />
      </div>
      <div class="topbar-actions">
        <button class="history-open" type="button">역사</button>
        <button class="suggest-open" type="button">편집 제안</button>
        <button
          class="theme-toggle"
          type="button"
          aria-label="테마 전환"
        ></button>
      </div>
    </div>`;
}

/* ---------- 문서 머리말 (제목 + 수정 시각) ---------- */
export function DocHead(doc) {
  return `
    <h1 class="title">${esc(doc.title)}</h1>
    <div class="subtitle">최근 수정 시각: ${esc(doc.updated)}</div>`;
}

/* ---------- 우측 박스 1 — 관련 문서 ---------- */
export function RelatedBox(slug) {
  const doc = DOCS[slug];
  /* 등록부에 related 가 없으면 자기 자신을 뺀 전체 문서를 보여준다. */
  const list = (doc.related || Object.keys(DOCS).filter((s) => s !== slug))
    .filter((s) => DOCS[s])
    .map(
      (s) =>
        `<li><a href="${docHref(s)}">${esc(DOCS[s].title)}</a></li>`,
    )
    .join("");

  return `
    <section class="rail-box">
      <div class="rail-title">관련 문서</div>
      ${list ? `<ul class="rail-list">${list}</ul>` : `<p class="note">아직 없습니다.</p>`}
    </section>`;
}

/* ---------- 우측 박스 2 — 바로가기 ---------- */
export function ShortcutsBox(slug) {
  const items = DOCS[slug].shortcuts || [];
  const list = items
    .map(
      (it) =>
        `<li><a href="${esc(it.href)}" target="_blank" rel="noopener">${esc(it.label)}</a></li>`,
    )
    .join("");

  return `
    <section class="rail-box">
      <div class="rail-title">바로가기</div>
      ${list ? `<ul class="rail-list">${list}</ul>` : `<p class="note">아직 없습니다.</p>`}
    </section>`;
}

/* ---------- 우측 영역 전체 ---------- */
export function Rail(slug) {
  return RelatedBox(slug) + ShortcutsBox(slug);
}
