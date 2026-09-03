/* ============================================================
   history.js — 역사 (위키 전체 편집 내역)

   이 위키는 저장소 파일을 그대로 배포하므로, 편집 내역은 곧 저장소의 커밋
   목록이다. 헤더의 "역사" 버튼을 누르면 GitHub REST API 로 읽어 와
   대화상자에 시간순(최신순)으로 보여 준다. 어느 문서에서 열어도 같은
   목록이다 — 문서별로 나누지 않는다.

     GET /repos/{owner}/{repo}/commits?sha=<브랜치>

   토큰 없이 부르기 때문에 IP 당 시간당 60회 제한이 있다. 그래서 버튼을 눌러
   대화상자를 열 때 처음 한 번만 부르고 캐시해 둔다.
   저장소 주소는 assets/js/docs.js 의 REPO 에 있다.
   ============================================================ */

import { REPO } from "./docs.js";
import { esc } from "./components.js";

const PER_PAGE = 100; // 한 번에 보여 줄 최대 커밋 수 (GitHub 상한)

/* 한 번 읽은 커밋 목록. 다시 부르지 않는다. */
let cache = null;

function apiUrl() {
  const q = new URLSearchParams({
    sha: REPO.branch,
    per_page: String(PER_PAGE),
  });
  return `https://api.github.com/repos/${REPO.owner}/${REPO.name}/commits?${q}`;
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
        <span class="hist-sha">${esc(sha.slice(0, 7))}</span>
      </div>
    </li>`;
}

function List(commits) {
  if (!commits.length) {
    return `<p class="hist-msg">아직 편집 내역이 없습니다.</p>`;
  }

  return `<ol class="hist-list">${commits.map(CommitItem).join("")}</ol>`;
}

/* ---------- 동작 ---------- */

async function fetchCommits() {
  if (cache) return cache;

  const res = await fetch(apiUrl(), {
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

  cache = await res.json();
  return cache;
}

async function load() {
  const body = document.getElementById("hist-body");
  const head = document.getElementById("hist-doc");
  if (!body) return;

  /* 이미 채워 둔 목록이 있으면 그대로 둔다 (다시 열 때 깜빡이지 않게) */
  if (body.querySelector(".hist-list")) return;

  if (head) {
    head.textContent = `위키 전체 편집 내역 — ${REPO.owner}/${REPO.name} (${REPO.branch})`;
  }
  body.innerHTML = `<p class="hist-msg">편집 내역을 불러오는 중…</p>`;

  try {
    body.innerHTML = List(await fetchCommits());
  } catch (err) {
    body.innerHTML = `
      <p class="hist-msg bad">불러오지 못했습니다 — ${esc(err.message)}</p>`;
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
