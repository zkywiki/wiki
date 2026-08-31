/* ============================================================
   suggest.js — 편집 제안

   서버가 없으므로 폼 내용을 mailto: 주소로 조립해 방문자의 메일 앱을 띄운다.
   실제 발송은 방문자가 하고, 받는 사람은 SITE.contact 이다.

   나중에 "페이지에서 바로 전송"으로 바꾸려면 send() 하나만 갈아끼우면 된다.
   (Formspree · Web3Forms 같은 외부 폼 서비스에 fetch POST → 그쪽이 메일 발송)
   ============================================================ */

import { SITE, DOCS } from "./docs.js";
import { esc } from "./components.js";

/* mailto 주소는 너무 길면 메일 앱이 잘라먹는다. 넉넉히 잡아도 이 정도가 한계. */
const MAX = 1500;

function address() {
  return SITE.contact.user + "@" + SITE.contact.host;
}

/* ---------- 화면 ---------- */
export function SuggestDialog() {
  const types = ["오타·표현 수정", "내용 추가", "내용 정정", "기타"];
  return `
    <dialog class="suggest" id="suggest">
      <form class="suggest-form" method="dialog">
        <div class="suggest-head">
          <strong>편집 제안</strong>
          <button
            class="suggest-close"
            type="button"
            value="cancel"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <p class="suggest-doc" id="suggest-doc"></p>

        <label class="suggest-label" for="suggest-type">종류</label>
        <select class="suggest-input" id="suggest-type">
          ${types.map((t) => `<option>${esc(t)}</option>`).join("")}
        </select>

        <label class="suggest-label" for="suggest-body">내용</label>
        <textarea
          class="suggest-input"
          id="suggest-body"
          rows="7"
          maxlength="${MAX}"
          placeholder="어느 문단의 무엇을 어떻게 고치면 좋을지 적어 주세요."
          required
        ></textarea>

        <label class="suggest-label" for="suggest-from">
          작성자 <span class="suggest-optional">(선택)</span>
        </label>
        <input
          class="suggest-input"
          id="suggest-from"
          type="text"
          maxlength="60"
          placeholder="닉네임이나 연락처"
        />

        <p class="suggest-note" id="suggest-hint"></p>

        <div class="suggest-actions">
          <button class="suggest-btn" type="button" value="cancel">취소</button>
          <button class="suggest-btn primary" type="button" id="suggest-send">
            메일 앱으로 보내기
          </button>
        </div>
      </form>
    </dialog>`;
}

/* ---------- 동작 ---------- */
let currentSlug = null;

/* 문서가 바뀔 때마다 app.js 가 알려준다. 제안 메일에 어느 문서인지 담기 위해. */
export function setSuggestDoc(slug) {
  currentSlug = slug;
  const doc = DOCS[slug];
  const el = document.getElementById("suggest-doc");
  if (el && doc) el.textContent = `문서: ${doc.title}`;
}

/* 주소 조립만 따로. 이렇게 빼 두면 실제로 메일 앱을 띄우지 않고도 확인할 수 있다. */
export function buildMailto({ slug, type, from, text, url }) {
  const doc = DOCS[slug];
  const subject = `[${SITE.name}${SITE.nameAccent}] 편집 제안 — ${doc.title} (${type})`;
  const lines = [
    `문서: ${doc.title}`,
    `주소: ${url}`,
    `종류: ${type}`,
    from ? `작성자: ${from}` : null,
    "",
    text,
  ].filter((l) => l !== null);

  return (
    "mailto:" +
    encodeURIComponent(address()) +
    "?subject=" +
    encodeURIComponent(subject) +
    "&body=" +
    encodeURIComponent(lines.join("\n"))
  );
}

function send() {
  const body = document.getElementById("suggest-body");
  if (!body.value.trim()) {
    body.focus();
    return;
  }

  location.href = buildMailto({
    slug: currentSlug,
    type: document.getElementById("suggest-type").value,
    from: document.getElementById("suggest-from").value.trim(),
    text: body.value.trim(),
    url: location.href,
  });

  document.getElementById("suggest").close();
}

export function initSuggest() {
  const dialog = document.getElementById("suggest");
  if (!dialog) return;

  /* 받는 주소는 화면에도 보여 준다. 메일 앱이 없는 사람은 직접 복사해서 쓸 수 있게. */
  const hint = document.getElementById("suggest-hint");
  if (hint) {
    hint.textContent = `보내기를 누르면 메일 앱이 열립니다.`;
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".suggest-open")) {
      dialog.showModal();
      document.getElementById("suggest-body")?.focus();
      return;
    }
    if (e.target.closest?.("#suggest-send")) {
      send();
      return;
    }
    if (e.target.closest?.('.suggest [value="cancel"]')) {
      dialog.close();
      return;
    }
    /* 바깥(어두운 배경)을 누르면 닫기 */
    if (e.target === dialog) dialog.close();
  });
}
