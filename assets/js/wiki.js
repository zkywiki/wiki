/* ============================================================
   wiki.js — 문서 화면의 동작

   두 갈래로 나뉜다.
     initGlobal()   : 페이지에 한 번만. 테마 토글, 문서 내 검색, 각주 툴팁,
                      문단 접기 클릭 등 화면 전체에 거는 이벤트.
     initDocument() : 문서를 새로 그릴 때마다. 문단 접기 구성, 각주 번호 매기기,
                      --취소선-- 변환, 경과일 채우기처럼 문서 내용에 붙는 작업.

   문서를 갈아끼우는 쪽(app.js)이 순서대로 불러 준다.
   ============================================================ */

/* ---------- 1. 테마 ---------- */
const THEME_KEY = "wiki-theme";
const root = document.documentElement;

function stored() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null; // 사생활 보호 모드 등
  }
}
function save(v) {
  try {
    localStorage.setItem(THEME_KEY, v);
  } catch (e) {
    /* 저장 실패해도 동작엔 지장 없음 */
  }
}
function systemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}
/* 지금 화면에 적용 중인 테마 */
function currentTheme() {
  return root.getAttribute("data-theme") || (systemPrefersDark() ? "dark" : "light");
}

/* 헤더는 문서를 넘겨도 다시 그려지므로, 버튼 모양 갱신은 밖에서도 부를 수 있게 내보낸다. */
export function paintToggle() {
  const dark = currentTheme() === "dark";
  const label = dark ? "라이트 모드로 전환" : "다크 모드로 전환";
  document.querySelectorAll(".theme-toggle").forEach((b) => {
    b.textContent = dark ? "☀️" : "🌙"; // 누르면 바뀔 방향이 아니라 '현재' 상태 표시
    b.setAttribute("aria-label", label);
    b.setAttribute("title", label);
  });
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  save(next);
  paintToggle();
}

/* ---------- 2. 문단 접기 ---------- */
const LEVEL = { H2: 2, H3: 3, H4: 4 };

/* 문단에 포함시키면 안 되는 꼬리 블록 (분류·푸터) */
function isTail(el) {
  return el.classList?.contains("category") || el.classList?.contains("footer");
}

function setupSections() {
  const main = document.querySelector(".article .main");
  if (!main) return;

  /* 감싸기 전에 제목 목록을 먼저 확보한다 (아래에서 DOM 을 옮기기 때문) */
  const headings = [...main.children].filter((el) => LEVEL[el.tagName]);

  headings.forEach((h) => {
    const level = LEVEL[h.tagName];

    /* 다음 '같거나 더 높은 단계'의 제목 직전까지가 이 문단의 내용.
       h2 를 접으면 그 아래 h3 문단들도 함께 접힌다. */
    const body = document.createElement("div");
    body.className = "sec-body";
    let n = h.nextSibling;
    while (n) {
      const next = n.nextSibling;
      if (n.nodeType === 1 && (LEVEL[n.tagName] <= level || isTail(n))) break;
      body.appendChild(n);
      n = next;
    }
    if (!body.childNodes.length) return; // 내용이 없으면 접을 것도 없다

    h.parentNode.insertBefore(body, h.nextSibling);

    h.classList.add("sec-head");
    h.setAttribute("role", "button");
    h.setAttribute("tabindex", "0");
    h.setAttribute("aria-expanded", "true");
    h.__body = body;
  });
}

function setSection(h, open) {
  if (!h.__body) return;
  h.setAttribute("aria-expanded", open ? "true" : "false");
  h.__body.hidden = !open;
}

/* 접혀 있는 문단으로 이동할 때(목차 클릭, #앵커 링크) 자동으로 펼친다. */
function revealTarget(id) {
  const el = id && document.getElementById(id);
  if (!el) return;

  if (el.classList.contains("sec-head")) setSection(el, true);
  revealNode(el);
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* 접힌 문단 안에 있는 노드를 화면에 드러낸다. */
function revealNode(node) {
  let p = node.parentNode;
  while (p && p !== document.body) {
    if (p.classList?.contains("sec-body") && p.hidden) {
      const head = p.previousElementSibling;
      if (head?.classList.contains("sec-head")) setSection(head, true);
      else p.hidden = false;
    }
    p = p.parentNode;
  }
}

/* ---------- 3. 각주 ---------- */
/* <span class="note">부연 설명</span> → [1] 윗첨자 + 마우스 오버 툴팁.
   본문과 인포박스를 모두 훑고, 문서에 나오는 순서대로 번호를 매긴다.
   각주가 아니라 그냥 작은 글씨로 둘 곳(항목 이름 등)에는 .note-plain 을 쓴다. */
let tip = null;

function ensureTip() {
  if (tip) return tip;
  tip = document.createElement("div");
  tip.className = "fn-tip";
  tip.id = "fn-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);
  return tip;
}

function showTip(ref) {
  const el = ensureTip();
  el.innerHTML = ref.__note;
  el.hidden = false;

  /* 위치를 재기 전에 화면 왼쪽 위로 보내 두어야 크기가 제대로 나온다. */
  el.style.left = "0px";
  el.style.top = "0px";

  const r = ref.getBoundingClientRect();
  const t = el.getBoundingClientRect();
  const pad = 8;

  let left = r.left + r.width / 2 - t.width / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - t.width - pad));

  let top = r.bottom + pad; // 기본은 각주 아래
  if (top + t.height > window.innerHeight - pad) {
    top = r.top - t.height - pad; // 아래가 좁으면 위로
  }

  el.style.left = left + "px";
  el.style.top = Math.max(pad, top) + "px";
}

function hideTip() {
  if (tip) tip.hidden = true;
}

function setupFootnotes() {
  const scope = document.querySelector(".article");
  if (!scope) return;

  /* 인포박스와 본문을 함께 훑는다. 마크업이 화면에 보이는 차례
     (목차 → 프로필 → 본문)대로 놓여 있으므로, 문서 순서가 곧 읽는 순서다.
     각주로 만들 것이 아니라 그냥 작은 글씨로 둘 곳에는 .note-plain 을 쓴다. */
  scope.querySelectorAll(".note:not(.note-plain)").forEach((n, i) => {
    const sup = document.createElement("sup");
    sup.className = "fn";
    sup.textContent = "[" + (i + 1) + "]";
    sup.tabIndex = 0;
    sup.setAttribute("role", "button");
    sup.setAttribute("aria-describedby", "fn-tip");
    sup.setAttribute("aria-label", "각주 " + (i + 1));
    sup.__note = n.innerHTML;
    n.parentNode.replaceChild(sup, n);
  });
}

/* ---------- 4. 취소선 ---------- */
/* 나무위키식 --취소선-- 표기를 <s class="strike"> 로 바꾼다.
   본문에 그대로 --속마음-- 이라고 쓰면 취소선 + 흐린 글자로 나온다.

   오작동을 막기 위한 조건:
     · 코드 블록(code, pre)과 속성값은 건드리지 않는다 (텍스트 노드만 훑는다)
     · 여는 -- 뒤와 닫는 -- 앞에 공백이 오면 무시한다 (뺄셈·구분선 오인 방지)
     · 안쪽에 또 -- 가 있거나 80자를 넘으면 무시한다 */
const STRIKE = /--([\s\S]{1,80}?)--/g;
const SKIP_TAGS = { CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, S: 1 };

function looksLikeStrike(inner) {
  return (
    inner.length > 0 &&
    !/^\s/.test(inner) &&
    !/\s$/.test(inner) &&
    !inner.includes("--")
  );
}

function applyStrike() {
  const scope = document.querySelector(".article");
  if (!scope) return;

  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      for (let p = node.parentNode; p && p !== scope; p = p.parentNode) {
        if (SKIP_TAGS[p.tagName]) return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.includes("--")
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);

  targets.forEach((node) => {
    let changed = false;
    const frag = document.createDocumentFragment();
    let last = 0;

    for (const m of node.nodeValue.matchAll(STRIKE)) {
      if (!looksLikeStrike(m[1])) continue;

      frag.append(document.createTextNode(node.nodeValue.slice(last, m.index)));
      const s = document.createElement("s");
      s.className = "strike";
      s.textContent = m[1];
      frag.append(s);

      last = m.index + m[0].length;
      changed = true;
    }

    if (!changed) return;
    frag.append(document.createTextNode(node.nodeValue.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

/* ---------- 5. 경과일 ---------- */
/* <span class="elapsed" data-since="2025-10-16"></span> → "319일 경과".
   문서를 열 때마다 오늘 기준으로 다시 계산하므로 날짜 수를 적어 두고 잊을 일이 없다. */
function fillElapsed() {
  const now = new Date();
  /* 시:분:초를 버리고 '날짜'끼리만 뺀다. UTC 로 맞춰야 서머타임 영향이 없다. */
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  document.querySelectorAll("[data-since]").forEach((el) => {
    const raw = el.getAttribute("data-since");
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!m) return;

    const from = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    const days = Math.round((today - from) / 86400000);

    el.textContent =
      days >= 0
        ? days.toLocaleString("ko-KR") + "일 경과"
        : (-days).toLocaleString("ko-KR") + "일 남음";
    el.setAttribute("title", raw + " 기준");
  });
}

/* ---------- 6. 문서 내 검색 ---------- */
function doSearch() {
  const input = document.getElementById("q");
  const article = document.querySelector(".article");
  if (!input || !article) return;

  const q = input.value.trim();
  if (!q) return;

  /* 이전 하이라이트 제거 */
  article.querySelectorAll("mark").forEach((m) => {
    m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
  });
  article.normalize();

  const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const n of nodes) {
    const idx = n.nodeValue.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) continue;

    const span = document.createElement("span");
    span.append(document.createTextNode(n.nodeValue.slice(0, idx)));
    const mark = document.createElement("mark");
    mark.textContent = n.nodeValue.slice(idx, idx + q.length);
    span.append(mark, document.createTextNode(n.nodeValue.slice(idx + q.length)));
    n.parentNode.replaceChild(span, n);

    revealNode(mark);
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
}

/* ---------- 7. 우측 하단 이동 버튼 ---------- */
/* components.js 의 Fab() 이 그린 세 버튼(목차 / 맨 위 / 맨 아래)의 동작.
   상단 바가 58px 높이로 떠 있으므로 목차로 갈 때는 그만큼 위를 비워 둔다. */
const TOPBAR_GAP = 70;

function scrollToToc() {
  const toc = document.querySelector(".article .toc");
  if (!toc) return;
  const top = window.scrollY + toc.getBoundingClientRect().top - TOPBAR_GAP;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToBottom() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: "smooth",
  });
}

/* 목차가 없는 문서에서는 목차 버튼을 감춘다. */
function paintFab() {
  const btn = document.querySelector(".fab-toc");
  if (btn) btn.hidden = !document.querySelector(".article .toc");
}

/* ============================================================
   초기화
   ============================================================ */

let globalReady = false;

/* 페이지에 한 번만. 이벤트는 전부 document 에 위임하므로
   문서를 갈아끼워도 다시 걸 필요가 없다. */
export function initGlobal() {
  if (globalReady) return;
  globalReady = true;

  /* 테마 */
  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".theme-toggle")) toggleTheme();
  });
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.(
    "change",
    () => {
      if (!stored()) paintToggle(); // 직접 고른 적이 없을 때만 OS 를 따라간다
    },
  );

  /* 문단 접기 */
  document.addEventListener("click", (e) => {
    const h = e.target.closest?.(".sec-head");
    if (!h) return;
    if (e.target.closest("a") || e.target.closest(".fn")) return; // 링크·각주는 예외
    setSection(h, h.getAttribute("aria-expanded") === "false");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const h = e.target.closest?.(".sec-head");
    if (!h) return;
    e.preventDefault();
    setSection(h, h.getAttribute("aria-expanded") === "false");
  });

  /* 문서 안 #앵커 이동 (목차 등) */
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    if (!id) return;
    e.preventDefault();
    revealTarget(id);
    history.replaceState?.(null, "", "#" + id);
  });

  /* 각주 툴팁 */
  document.addEventListener("mouseover", (e) => {
    const fn = e.target.closest?.(".fn");
    if (fn) showTip(fn);
  });
  document.addEventListener("mouseout", (e) => {
    const fn = e.target.closest?.(".fn");
    if (fn && !fn.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener("focusin", (e) => {
    const fn = e.target.closest?.(".fn");
    if (fn) showTip(fn);
  });
  document.addEventListener("focusout", (e) => {
    if (e.target.closest?.(".fn")) hideTip();
  });
  /* 터치 기기에는 마우스 오버가 없으므로 탭으로도 열리게 한다. */
  document.addEventListener("click", (e) => {
    const fn = e.target.closest?.(".fn");
    if (!fn) return;
    e.stopPropagation();
    if (tip && !tip.hidden) hideTip();
    else showTip(fn);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTip();
  });
  window.addEventListener("scroll", hideTip, true);
  window.addEventListener("resize", hideTip);

  /* 우측 하단 이동 버튼 */
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.(".fab-btn");
    if (!b) return;
    if (b.classList.contains("fab-toc")) scrollToToc();
    else if (b.classList.contains("fab-top")) scrollToTop();
    else scrollToBottom();
  });

  /* 검색 */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target?.id === "q") {
      e.preventDefault();
      doSearch();
    }
  });
}

/* 문서를 새로 그릴 때마다. */
export function initDocument() {
  hideTip();
  paintToggle();
  applyStrike(); // 각주 안의 --취소선-- 도 함께 처리되도록 먼저
  setupFootnotes();
  setupSections();
  fillElapsed();
  paintFab();
}
