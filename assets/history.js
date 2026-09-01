/* ============================================================
   history.js — 역사 (문서 편집 내역)

   이 위키는 저장소 파일을 그대로 배포하므로, 한 문서의 편집 내역은 곧
   그 문서 파일(docs/<슬러그>.html)의 커밋 목록이다. 헤더의 "역사" 버튼을
   누르면 GitHub REST API 로 읽어 와 대화상자에 시간순으로 보여 준다.

     GET /repos/{owner}/{repo}/commits?path=docs/<슬러그>.html&sha=<브랜치>

   토큰 없이 부르기 때문에 IP 당 시간당 60회 제한이 있다. 그래서 버튼을 눌러
   대화상자를 열 때 처음 한 번만 부르고, 문서별로 캐시해 둔다.
   저장소 주소는 assets/docs.js 의 REPO 에 있다.
   ============================================================ */

import { DOCS, REPO } from "./docs.js";
import { esc } from "./components.js";

const PER_PAGE = 40; // 한 문서에서 보여 줄 최대 커밋 수

/* 문서 파일별 커밋 목록. 한 번 읽으면 다시 부르지 않는다. */
const cache = new Map();

function apiUrl(file) {
  const q = new URLSearchParams({
    path: file,
    sha: REPO.branch,
    per_page: String(PER_PAGE),
  });
  return `https://api.github.com/repos/${REPO.owner}/${REPO.name}/commits?${q}`;
}

/* GitHub 에서 같은 목록을 보는 주소 (대화상자 맨 아래 링크) */
function pageUrl(file) {
  return `https://github.com/${REPO.owner}/${REPO.name}/commits/${REPO.branch}/${file}`;
}

function commitUrl(sha) {
  return `https://github.com/${REPO.owner}/${REPO.name}/commit/${sha}`;
}

/* ---------- 표시용 다듬기 ---------- */

/* 커밋 시각은 UTC 로 온다. 한국 시각으로 "2026-09-01 12:30" 처럼 고친다. */
function stamp(iso) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date(iso))
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

/* "3일 전" 같은 상대 시각. 문서 머리말의 경과일 표기와 결이 같다. */
const rtf = new Intl.RelativeTimeFormat("ko", { numeric: "auto" });
const UNITS = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

function ago(iso) {
  const sec = (Date.now() - new Date(iso).getTime()) / 1000;
  for (const [unit, size] of UNITS) {
    if (sec >= size) return rtf.format(-Math.floor(sec / size), unit);
  }
  return "방금";
}

/* 커밋 메시지를 제목 한 줄과 본문으로 나눈다.
   커밋 도구가 붙이는 꼬리말(Co-Authored-By, 생성 안내)은 보여 주지 않는다. */
function message(raw) {
  const [title, ...rest] = String(raw).split("\n");
  const body = rest
    .filter((l) => !/^(Co-Authored-By:|🤖 Generated with)/i.test(l.trim()))
    .join("\n")
    .trim();

  return { title: title.trim(), body };
}

/* ---------- 화면 ---------- */
export function HistoryDialog() {
  return `
    <dialog class="hist" id="history">
      <div class="hist-inner">
        <div class="hist-head">
          <strong>역사</strong>
          <button
            class="hist-close"
            type="button"
            value="cancel"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <p class="hist-doc" id="hist-doc"></p>
        <div class="hist-body" id="hist-body" aria-live="polite"></div>
      </div>
    </dialog>`;
}

function CommitItem(c) {
  const { title, body } = message(c.commit?.message || "");
  const iso = c.commit?.author?.date || c.commit?.committer?.date;
  const sha = String(c.sha || "");

  return `
    <li class="hist-item">
      <div class="hist-when">
        <time datetime="${esc(iso || "")}">${esc(iso ? stamp(iso) : "-")}</time>
        <span class="hist-ago">${esc(iso ? ago(iso) : "")}</span>
      </div>
      <div class="hist-title">${esc(title)}</div>
      ${body ? `<pre class="hist-detail">${esc(body)}</pre>` : ""}
      <div class="hist-meta">
        <a
          class="hist-sha"
          href="${esc(commitUrl(sha))}"
          target="_blank"
          rel="noopener"
          >${esc(sha.slice(0, 7))}</a
        >
      </div>
    </li>`;
}

function List(commits, file) {
  if (!commits.length) {
    return `<p class="hist-msg">아직 편집 내역이 없습니다.</p>`;
  }

  return `
    <ol class="hist-list">${commits.map(CommitItem).join("")}</ol>
    <p class="hist-more">
      <a href="${esc(pageUrl(file))}" target="_blank" rel="noopener"
        >GitHub 에서 전체 내역 보기</a
      >
    </p>`;
}

/* ---------- 동작 ---------- */
let currentSlug = null;

/* 문서가 바뀔 때마다 app.js 가 알려준다. */
export function setHistoryDoc(slug) {
  currentSlug = slug;

  /* 다른 문서로 옮겼으면 이전 문서의 목록은 지워 둔다.
     (닫혀 있는 대화상자를 미리 채워 두지 않는다 — 열 때 부른다) */
  const body = document.getElementById("hist-body");
  if (body) body.innerHTML = "";
}

async function fetchCommits(file) {
  if (cache.has(file)) return cache.get(file);

  const res = await fetch(apiUrl(file), {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!res.ok) {
    /* 403 은 대개 요청 한도 초과다. 이유를 그대로 보여 준다. */
    const reason =
      res.status === 403
        ? "GitHub 요청 한도를 넘었습니다. 잠시 후 다시 시도해 주세요."
        : `HTTP ${res.status}`;
    throw new Error(reason);
  }

  const list = await res.json();
  cache.set(file, list);
  return list;
}

async function load() {
  const doc = DOCS[currentSlug];
  const body = document.getElementById("hist-body");
  const head = document.getElementById("hist-doc");
  if (!doc || !body) return;

  head.textContent = `문서: ${doc.title} (${doc.file})`;
  body.innerHTML = `<p class="hist-msg">편집 내역을 불러오는 중…</p>`;

  try {
    body.innerHTML = List(await fetchCommits(doc.file), doc.file);
  } catch (err) {
    body.innerHTML = `
      <p class="hist-msg bad">불러오지 못했습니다 — ${esc(err.message)}</p>
      <p class="hist-more">
        <a href="${esc(pageUrl(doc.file))}" target="_blank" rel="noopener"
          >GitHub 에서 보기</a
        >
      </p>`;
  }
}

export function initHistory() {
  const dialog = document.getElementById("history");
  if (!dialog) return;

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".history-open")) {
      dialog.showModal();
      load();
      return;
    }
    if (e.target.closest?.('.hist [value="cancel"]')) {
      dialog.close();
      return;
    }
    /* 바깥(어두운 배경)을 누르면 닫기 */
    if (e.target === dialog) dialog.close();
  });
}
