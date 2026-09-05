/* ============================================================
   suggest.js — 편집 제안

   폼 내용을 EmailJS 로 바로 보낸다. 메일 앱이 열리지 않고 페이지 안에서 끝난다.
   받는 주소는 코드에 없다 — EmailJS 템플릿의 "To Email" 에 설정한다.

   보내는 사람은 언제나 "익명의 쿠식이"다. 누가 보냈는지는 묻지 않는다.

   그림은 메일에 붙이지 않는다. EmailJS 의 첨부 기능이 유료 플랜 전용이라,
   imgbb 에 먼저 올리고 메일 본문에는 그 주소만 적는 방식을 쓴다.
   보내기 전에 브라우저 안에서 크기를 줄이므로 원본이 커도 괜찮다.

   설정값은 assets/js/docs.js 의 EMAIL, IMGBB 에 있다.
   ============================================================ */

import { SITE, DOCS, EMAIL, IMGBB } from "./docs.js";
import { esc } from "./components.js";

const API = "https://api.emailjs.com/api/v1.0/email/send";
const UPLOAD = "https://api.imgbb.com/1/upload";
const MAX = 1500;

/* 보내는 사람 이름 — 제보자를 묻지 않으므로 하나로 고정한다. */
const SENDER = "익명의 쿠식이";

/* 그림 관련 한도.
   긴 변을 MAX_SIDE 로 줄이고 JPEG 로 다시 굽는다. 화면 캡처나 사진을 그대로
   올려도 몇백 KB 로 떨어지므로 올리는 시간이 짧다. */
const MAX_FILES = 3;
/* 고를 수 있는 장수를 왜 이렇게 묶어 두었는지 알리는 한 줄.
   버튼 옆이 아니라 아래에 작은 글씨로 깐다 (버튼이 밀려 찌그러지지 않도록). */
const LIMIT_NOTE = `기술적 문제로 한 번에 ${MAX_FILES}장씩 밖에 첨부가 되지 않습니다. 불편을 드려 죄송합니다.`;
const MAX_SIDE = 1600;
const QUALITY = 0.82;
/* 줄이지 않고 그대로 올리는 것(움직이는 GIF)의 크기 상한 */
const MAX_RAW = 8 * 1024 * 1024;

function configured() {
  return Boolean(EMAIL.publicKey && EMAIL.serviceId && EMAIL.templateId);
}

/* imgbb 키가 없으면 이미지 칸을 아예 만들지 않는다. */
function canAttach() {
  return Boolean(IMGBB.key);
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

        ${canAttach() ? ImageField() : ""}

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

/* 그림 고르는 칸. 진짜 <input type="file"> 은 숨겨 두고 label 을 버튼처럼 쓴다
   (브라우저마다 제각각인 기본 모양을 피하려고). */
function ImageField() {
  return `
    <span class="suggest-label">
      이미지 <span class="suggest-optional">(선택 · ${MAX_FILES}장까지)</span>
    </span>
    <div class="suggest-files">
      <label class="suggest-pick" for="suggest-file">
        <input
          class="suggest-file"
          id="suggest-file"
          type="file"
          accept="image/*"
          multiple
        />
        이미지 업로드
      </label>
      <span class="suggest-optional" id="suggest-filecount"></span>
    </div>
    <p class="suggest-filenote">${esc(LIMIT_NOTE)}</p>
    <ul class="suggest-thumbs" id="suggest-thumbs"></ul>`;
}

/* ---------- 동작 ---------- */
let currentSlug = null;

/* 고른 그림들 — { id, file, url }. url 은 미리보기용 objectURL 이라 다 쓰고 나면
   반드시 되돌려 준다(revokeObjectURL). 안 그러면 메모리에 그대로 남는다. */
let picked = [];
let nextId = 1;

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

/* ---------- 고른 그림 ---------- */

function paintThumbs() {
  const list = document.getElementById("suggest-thumbs");
  const count = document.getElementById("suggest-filecount");
  if (!list) return;

  list.innerHTML = picked
    .map(
      (p) => `
      <li class="suggest-thumb">
        <img src="${p.url}" alt="${esc(p.file.name)}" />
        <button
          type="button"
          class="suggest-thumb-x"
          data-drop="${p.id}"
          aria-label="${esc(p.file.name)} 빼기"
        >✕</button>
      </li>`,
    )
    .join("");

  if (count) count.textContent = `${picked.length}/${MAX_FILES}장`;
}

function addFiles(files) {
  const room = MAX_FILES - picked.length;
  if (room <= 0) {
    say(`이미지는 ${MAX_FILES}장까지 붙일 수 있습니다.`, "bad");
    return;
  }

  const images = [...files].filter((f) => f.type.startsWith("image/"));
  if (!images.length) return;

  if (images.length > room) {
    say(`이미지는 ${MAX_FILES}장까지라 앞의 ${room}장만 넣었습니다.`, "bad");
  } else {
    say("");
  }

  images.slice(0, room).forEach((file) => {
    picked.push({ id: nextId++, file, url: URL.createObjectURL(file) });
  });
  paintThumbs();
}

function dropFile(id) {
  const i = picked.findIndex((p) => p.id === Number(id));
  if (i < 0) return;
  URL.revokeObjectURL(picked[i].url);
  picked.splice(i, 1);
  paintThumbs();
}

function clearFiles() {
  picked.forEach((p) => URL.revokeObjectURL(p.url));
  picked = [];
  const input = document.getElementById("suggest-file");
  if (input) input.value = "";
  paintThumbs();
}

/* ---------- 그림 줄이기 ---------- */

/* 파일을 캔버스에 그릴 수 있는 그림으로 바꾼다.
   createImageBitmap 이 빠르고 간단하지만 없는 브라우저도 있어 <img> 로 받는다. */
async function decode(file) {
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* HEIC 처럼 브라우저가 모르는 형식 — 아래 <img> 로 한 번 더 해 본다 */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => fail(new Error("그림을 읽지 못했습니다"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* 긴 변을 MAX_SIDE 로 줄이고 JPEG 로 다시 굽는다.
   움직이는 GIF 는 다시 구우면 첫 장면만 남으므로 원본 그대로 보낸다. */
async function shrink(file) {
  if (file.type === "image/gif") {
    if (file.size > MAX_RAW) throw new Error(`${file.name} 이(가) 너무 큽니다`);
    return file;
  }

  const src = await decode(file);
  const w = src.width;
  const h = src.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);

  const ctx = canvas.getContext("2d");
  /* JPEG 에는 투명이 없다. 흰 바닥을 먼저 깔지 않으면 투명한 PNG 가 까맣게 된다. */
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  src.close?.();

  const blob = await new Promise((ok) =>
    canvas.toBlob(ok, "image/jpeg", QUALITY),
  );
  if (!blob) throw new Error(`${file.name} 을(를) 줄이지 못했습니다`);
  return blob;
}

/* imgbb 에 한 장 올리고 주소를 돌려준다. */
async function upload(blob, name) {
  const form = new FormData();
  form.append("image", blob, name);

  const days = Number(IMGBB.expireDays) || 0;
  const query =
    `?key=${encodeURIComponent(IMGBB.key)}` +
    (days > 0 ? `&expiration=${Math.min(days, 180) * 86400}` : "");

  const res = await fetch(UPLOAD + query, { method: "POST", body: form });
  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || `HTTP ${res.status}`);
  }
  return json.data.url;
}

/* 다시 구운 그림은 속이 JPEG 이므로 확장자도 맞춰 준다.
   (shot.png 라는 이름으로 올려 두면 나중에 열 때 헷갈린다) */
function jpegName(name) {
  return name.replace(/\.[^.]*$/, "") + ".jpg";
}

/* 고른 그림을 차례로 올린다. 한 장이라도 실패하면 통째로 멈춘다 —
   그림이 빠진 채로 메일만 가면 받는 쪽이 영문을 모르기 때문이다. */
async function uploadAll() {
  const urls = [];
  for (let i = 0; i < picked.length; i++) {
    say(`이미지 올리는 중… (${i + 1}/${picked.length})`);
    const file = picked[i].file;
    const blob = await shrink(file);
    const name = blob === file ? file.name : jpegName(file.name);
    urls.push(await upload(blob, name));
  }
  return urls;
}

/* EmailJS 템플릿에 넘길 값들.

   템플릿이 쓰는 것은 name / message / time 세 개다.
   문서·주소·종류·이미지는 따로 넘길 자리가 없으므로 message 에 함께 적어 보낸다.
   (doc_title 같은 낱개 값도 같이 보내 두니, 나중에 템플릿에서 바로 쓸 수 있다) */
function params({ slug, type, text, url, images }) {
  const title = DOCS[slug].title;
  const shots = images.map((u, i) => `${i + 1}) ${u}`).join("\n");

  return {
    /* 템플릿이 쓰는 세 값 */
    name: SENDER,
    message: [
      `문서: ${title}`,
      `주소: ${url}`,
      `종류: ${type}`,
      "",
      text,
      ...(shots ? ["", "첨부 이미지:", shots] : []),
    ].join("\n"),
    time: new Date().toLocaleString("ko-KR", {
      dateStyle: "medium",
      timeStyle: "short",
    }),

    /* 템플릿에서 낱개로 쓰고 싶을 때를 위해 */
    doc_title: title,
    doc_url: url,
    type,
    from: SENDER,
    images: shots,
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
      "메일 발송 설정이 비어 있습니다. assets/js/docs.js 의 EMAIL 값을 채워 주세요.",
      "bad",
    );
    return;
  }

  button.disabled = true;

  try {
    /* 그림이 있으면 먼저 올리고, 받은 주소를 메일에 적는다. */
    let images = [];
    if (picked.length) {
      try {
        images = await uploadAll();
      } catch (err) {
        throw new Error(`이미지를 올리지 못했습니다 — ${err.message}`);
      }
    }

    say("보내는 중…");

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
          text,
          url: location.href,
          images,
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
    clearFiles();
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

  paintThumbs();

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
    /* 고른 그림 빼기 */
    const drop = e.target.closest?.("[data-drop]");
    if (drop) {
      dropFile(drop.dataset.drop);
      return;
    }
    if (e.target.closest?.('.suggest [value="cancel"]')) {
      dialog.close();
      return;
    }
    /* 바깥(어두운 배경)을 누르면 닫기 */
    if (e.target === dialog) dialog.close();
  });

  /* 그림 고르기 — 같은 파일을 다시 고를 수 있도록 value 를 비워 둔다 */
  document.addEventListener("change", (e) => {
    if (e.target?.id !== "suggest-file") return;
    addFiles(e.target.files);
    e.target.value = "";
  });

  /* 창을 닫으면 고른 그림도 놓아 준다 */
  dialog.addEventListener("close", clearFiles);
}
