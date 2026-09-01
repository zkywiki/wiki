/* ============================================================
   lightbox.js — 이미지 크게 보기

   문서 본문의 그림(.gallery 의 팬아트, .small-card 의 썸네일)을 누르면
   화면 가운데에 원래 크기로 띄운다. 뒤쪽 화면은 어둡게 깔고 흐리게 처리한다.

   본문은 문서를 넘길 때마다 통째로 갈리므로, 그림 하나하나에 이벤트를 걸지
   않고 document 에서 한 번만 받아 넘긴다(이벤트 위임).
   ============================================================ */

/* 크게 볼 수 있는 그림. 여기에 해당하면 커서가 돋보기로 바뀐다(.css) */
const TARGET = ".gallery img, .small-card .img img";

export function LightboxDialog() {
  return `
    <dialog class="lightbox" id="lightbox">
      <button
        class="lightbox-close"
        type="button"
        value="cancel"
        aria-label="닫기"
      >
        ✕
      </button>
      <figure class="lightbox-figure">
        <img class="lightbox-img" id="lightbox-img" alt="" />
        <figcaption class="lightbox-cap" id="lightbox-cap"></figcaption>
      </figure>
    </dialog>`;
}

function open(img) {
  const dialog = document.getElementById("lightbox");
  const big = document.getElementById("lightbox-img");
  const cap = document.getElementById("lightbox-cap");
  if (!dialog || !big) return;

  big.src = img.currentSrc || img.src;
  big.alt = img.alt || "";

  /* 그림 설명(alt)을 아래에 그대로 보여 준다. 없으면 자리도 두지 않는다. */
  const text = img.alt || "";
  cap.textContent = text;
  cap.hidden = !text;

  dialog.showModal();
}

/* 문서를 새로 그릴 때마다 app.js 가 부른다.
   키보드로도 열 수 있도록 대상 그림에 초점과 역할을 붙여 둔다.
   (문서 HTML 에는 아무것도 적지 않아도 되게 여기서 처리한다) */
export function setupLightboxTargets() {
  document.querySelectorAll(TARGET).forEach((img) => {
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", (img.alt || "그림") + " — 크게 보기");
  });
}

export function initLightbox() {
  const dialog = document.getElementById("lightbox");
  if (!dialog) return;

  document.addEventListener("click", (e) => {
    /* 열려 있는 동안에는 뒤쪽 화면에 클릭이 닿지 않는다.
       그림 자체를 누른 게 아니면 (닫기 버튼·어두운 배경 모두) 닫는다. */
    if (dialog.open) {
      if (!e.target.closest?.(".lightbox-figure")) dialog.close();
      return;
    }

    const img = e.target.closest?.(TARGET);
    if (img) open(img);
  });

  /* 키보드로도 열 수 있게 — 그림에 초점을 두고 Enter/Space */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const img = e.target.closest?.(TARGET);
    if (!img) return;
    e.preventDefault();
    open(img);
  });

  /* 닫을 때 src 를 비워 둔다 — 다음에 열 때 이전 그림이 잠깐 보이지 않도록. */
  dialog.addEventListener("close", () => {
    const big = document.getElementById("lightbox-img");
    if (big) big.removeAttribute("src");
  });
}
