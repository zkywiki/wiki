/* ============================================================
   docs.js — 사이트 정보와 문서 등록부

   문서를 추가하려면
   1) docs/<슬러그>.html 에 본문을 쓰고 (목차 / 본문 / 프로필 순서)
   2) 아래 DOCS 에 한 항목을 더한다.
   나머지(헤더, 관련 문서, 바로가기, 라우팅)는 알아서 따라온다.
   ============================================================ */

export const SITE = {
  name: "즈키",
  nameAccent: "위키", // 브랜드 뒷부분 (강조색으로 표시된다)
  searchPlaceholder: "이 문서에서 검색",
};

/* 문서를 여는 주소는 ?doc=<슬러그> 다. */
export const DOCS = {
  cuzky: {
    title: "즈키쿠",
    updated: "2026-08-31 17:44",
    file: "docs/cuzky.html",
    related: ["cupotify"], // 관련 문서 박스
    shortcuts: [
      // 바로가기 박스
      {
        label: "CHZZK 방송국",
        href: "https://chzzk.naver.com/25d498f6a601853e6b1d16d2e7884494",
      },
      { label: "YouTube @즈키쿠", href: "https://www.youtube.com/@즈키쿠" },
      {
        label: "YouTube @쿠포티파이",
        href: "https://www.youtube.com/@쿠포티파이",
      },
    ],
  },

  cupotify: {
    title: "쿠포티파이",
    updated: "2026-08-31 18:00",
    file: "docs/cupotify.html",
    related: ["cuzky"],
    shortcuts: [
      {
        label: "YouTube @쿠포티파이",
        href: "https://www.youtube.com/@쿠포티파이",
      },
    ],
  },
};

/* 슬러그가 없거나 잘못됐을 때 열 문서 */
export const HOME = "cuzky";
