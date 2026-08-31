/* ============================================================
   suggest.js — 편집 제안

   폼 내용을 EmailJS 로 바로 보낸다. 메일 앱이 열리지 않고 페이지 안에서 끝난다.
   받는 주소는 코드에 없다 — EmailJS 템플릿의 "To Email" 에 설정한다.

   설정값은 assets/docs.js 의 EMAIL 에 있다.
   ============================================================ */

import { SITE, DOCS, EMAIL } from "./docs.js";
import { esc } from "./components.js";

const API = "https://api.emailjs.com/api/v1.0/email/send";
const MAX = 1500;

function configured() {
  return Boolean(EMAIL.publicKey && EMAIL.serviceId && EMAIL.templateId);
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

        <p class="suggest-msg" id="suggest-msg" role="status" hidden></p>

        <div class="suggest-actions">
          <button class="suggest-btn" type="button" value="cancel">취소</button>
          <button class="suggest-btn primary" type="button" id="suggest-send">
            보내기
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

function say(text, kind) {
  const el = document.getElementById("suggest-msg");
  if (!el) return;
  el.textContent = text || "";
  el.className = "suggest-msg" + (kind ? " " + kind : "");
  el.hidden = !text;
}

/* EmailJS 템플릿에 넘길 값들.

   템플릿이 쓰는 것은 name / message / time 세 개다.
   문서·주소·종류는 따로 넘길 자리가 없으므로 message 앞머리에 함께 적어 보낸다.
   (doc_title 같은 낱개 값도 같이 보내 두니, 나중에 템플릿에서 바로 쓸 수 있다) */
function params({ slug, type, from, text, url }) {
  const title = DOCS[slug].title;
  const who = from || "(밝히지 않음)";

  return {
    /* 템플릿이 쓰는 세 값 */
    name: who,
    message: [`문서: ${title}`, `주소: ${url}`, `종류: ${type}`, "", text].join(
      "\n",
    ),
    time: new Date().toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }),

    /* 템플릿에서 낱개로 쓰고 싶을 때를 위해 */
    doc_title: title,
    doc_url: url,
    type,
    from: who,
    site: SITE.name + SITE.nameAccent,
  };
}

async function send() {
  const body = document.getElementById("suggest-body");
  const button = document.getElementById("suggest-send");

  const text = body.value.trim();
  if (!text) {
    body.focus();
    say("내용을 입력해 주세요.", "bad");
    return;
  }

  if (!configured()) {
    say(
      "메일 발송 설정이 비어 있습니다. assets/docs.js 의 EMAIL 값을 채워 주세요.",
      "bad",
    );
    return;
  }

  button.disabled = true;
  say("보내는 중…");

  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAIL.serviceId,
        template_id: EMAIL.templateId,
        user_id: EMAIL.publicKey,
        template_params: params({
          slug: currentSlug,
          type: document.getElementById("suggest-type").value,
          from: document.getElementById("suggest-from").value.trim(),
          text,
          url: location.href,
        }),
      }),
    });

    if (!res.ok) {
      /* EmailJS 는 실패 이유를 본문에 평문으로 준다. */
      throw new Error((await res.text()) || `HTTP ${res.status}`);
    }

    say(
      "전송 완료되었습니다. 검토 후 반영하도록 하겠습니다. 감사합니다!",
      "good",
    );
    body.value = "";
    document.getElementById("suggest-from").value = "";
    setTimeout(() => document.getElementById("suggest").close(), 1600);
  } catch (err) {
    say(`보내지 못했습니다 — ${err.message}`, "bad");
  } finally {
    button.disabled = false;
  }
}

export function initSuggest() {
  const dialog = document.getElementById("suggest");
  if (!dialog) return;

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".suggest-open")) {
      say("");
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
