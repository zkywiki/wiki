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

/* ============================================================
   편집 제안 메일 발송 (EmailJS)

   정적 페이지에서 바로 메일을 보내기 위해 EmailJS 의 REST API 를 쓴다.
   SDK 를 따로 불러오지 않고 fetch 한 번으로 끝낸다.

   아래 세 값은 EmailJS 대시보드에서 가져온다.
     publicKey  : Account → General → Public Key
     serviceId  : Email Services → 해당 서비스의 Service ID
     templateId : Email Templates → 해당 템플릿의 Template ID
   publicKey 는 공개돼도 되는 값이다(브라우저에서 쓰라고 만든 키).
   반대로 Private Key 는 절대 이 파일에 넣지 말 것 — 소스 보기로 그대로 노출된다.

   EmailJS 템플릿에서 쓸 수 있는 변수는 params 에 담아 보내는 이름들이다.
   suggest.js 가 보내는 것: doc_title, doc_url, type, from, message
   받는 주소는 EmailJS 템플릿의 "To Email" 에 설정한다 (코드에 적지 않는다).
   ============================================================ */
export const EMAIL = {
  publicKey: "7GRnS0Lk7LJ0ptiqL",
  serviceId: "service_vvp0san",
  templateId: "template_qy14ja6",
};

/* ============================================================
   저장소 정보 (역사 보기)

   이 위키는 저장소 파일을 그대로 배포하는 정적 페이지라, 편집 내역은 곧
   저장소의 커밋 목록이다. 헤더의 "역사" 버튼이 GitHub REST API 로 아래
   저장소의 커밋을 시간순으로 읽어 온다. 공개 저장소라 토큰은 필요 없다.
   ============================================================ */
export const REPO = {
  owner: "zkywiki",
  name: "wiki",
  branch: "main",
};

/* 문서를 여는 주소는 ?doc=<슬러그> 다. */
export const DOCS = {
  zky: {
    title: "즈키쿠",
    updated: "2026-09-05 01:47",
    file: "docs/zky.html",
    related: ["cuzky", "concert", "cupotify", "fanart"], // 관련 문서 박스
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
      { label: "네이버카페", href: "https://cafe.naver.com/findzky" },
    ],
  },

  cuzky: {
    title: "쿠즈키",
    updated: "2026-09-03 11:52",
    file: "docs/cuzky.html",
    related: ["zky", "cupotify"],
    shortcuts: [
      {
        label: "CHZZK 방송국",
        href: "https://chzzk.naver.com/25d498f6a601853e6b1d16d2e7884494",
      },
    ],
  },

  cupotify: {
    title: "쿠포티파이",
    updated: "2026-08-31 18:00",
    file: "docs/cupotify.html",
    related: ["zky"],
    shortcuts: [
      {
        label: "YouTube @쿠포티파이",
        href: "https://www.youtube.com/@쿠포티파이",
      },
    ],
  },

  concert: {
    title: "쿠린이 콘서트",
    updated: "2026-09-04 15:05",
    file: "docs/concert.html",
    related: ["zky", "cupotify"],
    shortcuts: [
      {
        label: "신청곡 링크",
        href: "https://docs.google.com/forms/d/1ue6-xKmnslr6nffJwsG-WV6nsISAa5JC1cgpmD4dkXI/viewform?edit_requested=true",
      },
    ],
  },

  fanart: {
    title: "팬아트",
    updated: "2026-09-01 12:30",
    file: "docs/fanart.html",
    related: ["zky", "cupotify"],
    shortcuts: [
      {
        label: "네이버카페 | 팬아트",
        href: "https://cafe.naver.com/f-e/cafes/31782237/menus/3?viewType=I",
      },
    ],
  },
};

/* 슬러그가 없거나 잘못됐을 때 열 문서 */
export const HOME = "zky";
