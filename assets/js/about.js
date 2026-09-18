/* ============================================================
   about.js — 안내 (헤더의 ? 버튼)

   이 위키가 무엇이고 어떻게 참여하는지를 문답으로 보여 주는 대화상자.
   문서와 상관없이 언제나 같은 내용이라, 어느 문서에서 열어도 똑같다.

   내용은 assets/js/docs.js 의 ABOUT 에 있다 — 글을 고칠 일은 그쪽에서 끝난다.
   ============================================================ */

import { ABOUT } from "./docs.js";
import { esc } from "./components.js";

/* app.js 가 body 끝에 한 번 꽂는다. */
export function AboutDialog() {
  const items = (ABOUT.faq || [])
    .map(
      (it) =>
        `<div class="about-item"><dt>${esc(it.q)}</dt><dd>${esc(it.a)}</dd></div>`,
    )
    .join("");

  return `
    <dialog class="about" id="about">
      <div class="about-inner">
        <div class="about-head">
          <strong>${esc(ABOUT.title)}</strong>
          <button
            class="about-close"
            type="button"
            value="cancel"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div class="about-body">
          <dl class="about-faq">${items}</dl>
        </div>
      </div>
    </dialog>`;
}

export function initAbout() {
  const dialog = document.getElementById("about");
  if (!dialog) return;

  document.addEventListener("click", (e) => {
    if (e.target.closest?.(".about-open")) {
      dialog.showModal();
      return;
    }
    if (e.target.closest?.('.about [value="cancel"]')) {
      dialog.close();
      return;
    }
    /* 바깥(어두운 배경)을 누르면 닫기 */
    if (e.target === dialog) dialog.close();
  });
}
