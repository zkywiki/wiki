# zkywiki

치지직 스트리머 **즈키쿠** 팬 위키.

빌드 과정이 없습니다. 저장소의 파일이 그대로 배포되고, 브라우저에서 자바스크립트가
문서를 조립합니다. (vite 는 로컬 개발 서버 용도로만 쓰며 배포에는 관여하지 않습니다.)

## 구조

```
.
├── index.html                    # 껍데기. 내용은 전부 app.js 가 채운다
├── assets/
│   ├── js/
│   │   ├── docs.js               # 사이트 정보 + 문서 등록부   ← 문서 추가는 여기
│   │   ├── components.js         # 헤더 / 관련 문서 / 바로가기 / 문서 머리말 / 이동 버튼
│   │   ├── app.js                # 조립 + 라우팅 (?doc=슬러그)
│   │   ├── wiki.js               # 테마·접기·각주·검색·경과일·이동 버튼
│   │   ├── history.js            # 역사 (위키 전체 커밋 목록)
│   │   ├── lightbox.js           # 이미지 크게 보기
│   │   └── suggest.js            # 편집 제안 메일
│   ├── images/                   # 문서에 쓰는 그림 + 아이콘·파비콘
│   ├── fanart/                   # 시청자 팬아트 (문서 그림과 구분해 둔다)
│   └── wiki.css                  # 공통 스타일 + 테마 색상 토큰
├── docs/
│   ├── zky.html                  # 즈키쿠 문서 본문
│   ├── cuzky.html                # 쿠즈키(캐릭터) 문서 본문
│   ├── cupotify.html             # 쿠포티파이 문서 본문
│   └── fanart.html               # 팬아트 문서 본문
├── package.json / vite.config.js # 로컬 개발 서버(HMR) 전용
├── .nojekyll                     # GitHub Pages 의 Jekyll 처리 비활성화
└── .github/workflows/deploy.yml  # main 푸시 시 Pages 자동 배포
```

## 로컬 실행

```bash
npm install     # 최초 1회
npm run dev     # http://localhost:5173 자동으로 열림
```

- `assets/wiki.css` 저장 → **새로고침 없이** 스타일만 교체됩니다.
- `index.html`, `assets/js/*.js`, `docs/*.html` 저장 → 자동 새로고침.
- 중단은 `Ctrl+C`.

> **`index.html` 을 파일로 직접 열면(`file://`) 동작하지 않습니다.**
> 문서 본문을 `fetch` 로 가져오는데 `file://` 에서는 브라우저가 이를 막기 때문입니다.
> 개발 서버 대신 `python3 -m http.server 8000` 으로 열어도 됩니다.

> Node 20.12 기준으로 vite 6 에 고정해 두었습니다. Node 를 20.19+ 또는 22 LTS 로 올리면
> `npm install -D vite@latest` 로 최신 버전을 쓸 수 있습니다.

## 문서 추가하기

1. `docs/<슬러그>.html` 에 본문을 씁니다. 완성된 페이지가 아니라 `.layout` 안에 꽂히는
   **조각**이라 `<html>` · `<head>` 없이 아래 세 덩어리만 순서대로 넣습니다.

   ```html
   <nav class="toc">…목차…</nav>
   <aside class="side">
     <table class="infobox">
       …프로필…
     </table>
   </aside>
   <section class="main">…본문…</section>
   ```

   화면에 보이는 차례(목차 왼쪽 위 → 프로필 오른쪽 위 → 본문 아래)와 같은 순서입니다.
   자리는 `.layout` 의 `grid-area` 가 정하므로 순서를 바꿔도 배치는 그대로입니다.

2. `assets/js/docs.js` 의 `DOCS` 에 한 항목을 더합니다.

   ```js
   mapleland: {
     title: "메이플랜드",
     updated: "2026-09-01 10:00",
     file: "docs/mapleland.html",
     related: ["zky"],                                    // 관련 문서 박스
     shortcuts: [{ label: "공식 사이트", href: "https://…" }], // 바로가기 박스
   },
   ```

헤더·라우팅·우측 박스는 등록부를 보고 알아서 따라옵니다.

## 목차

번호와 글자에 서로 다른 링크를 건다.

- **번호** — 이 문서 안의 해당 문단으로 스크롤. `<a class="toc-no" href="#문단id">` (내용은 비워 둔다)
- **글자** — 보통은 그냥 텍스트(`<span>`). 그 항목이 별도 문서로 분리돼 있으면 그 문서로 가는 링크를 건다.

```html
<li><a class="toc-no" href="#overview"></a><span>개요</span></li>

<!-- 숫자는 이 문서의 요약 문단으로, 글자는 다른 문서로 -->
<li>
  <a class="toc-no" href="#kupotify"></a><a href="?doc=cupotify">쿠포티파이</a>
</li>
```

번호는 `<ol>` 의 자동 마커가 아니라 CSS 카운터로 그립니다. 마커에는 링크를 걸 수 없기
때문입니다. 그래서 `href` 만 맞춰 두면 번호 자체는 자동으로 매겨집니다.

## 문서끼리 링크

`?doc=<슬러그>` 로 겁니다. 라우터가 가로채서 새로고침 없이 본문만 바꿉니다.

```html
자세한 내용은 <a href="?doc=cupotify">쿠포티파이</a> 문서 참고.
```

경로(`/cupotify`)가 아니라 쿼리를 쓰는 이유는, GitHub Pages 가 없는 경로를 404 로
돌려주기 때문입니다. `?doc=` 는 언제나 `index.html` 이 응답하므로 주소를 그대로
붙여넣거나 뒤로 가기를 눌러도 문서가 열립니다.

## 컴포넌트

`assets/js/components.js` 의 함수들이 HTML 문자열을 돌려주고 `app.js` 가 자리에 꽂습니다.

| 함수                 | 자리        | 내용                                      |
| -------------------- | ----------- | ----------------------------------------- |
| `Header()`           | 상단 바     | 브랜드, 검색창, 역사, 편집 제안, 테마 토글 |
| `DocHead(doc)`       | 문서 머리말 | 제목, 최근 수정 시각                      |
| `RelatedBox(slug)`   | 우측 박스 1 | 관련 문서 (`related`, 없으면 나머지 전체) |
| `ShortcutsBox(slug)` | 우측 박스 2 | 바로가기 (`shortcuts`)                    |
| `Fab()`              | 우측 하단   | 목차 / 맨 위 / 맨 아래 이동 버튼          |

## 역사 (편집 내역)

헤더의 **역사** 버튼을 누르면 위키 전체의 편집 내역이 대화상자로 열립니다.
어느 문서에서 열어도 같은 목록이고, 최신 순으로 늘어놓습니다 — 문서별로 나누지 않습니다.
이 위키는 저장소 파일을 그대로 배포하므로, 편집 내역은 곧 저장소의 커밋 목록입니다.
`assets/js/history.js` 가 GitHub REST API 로 읽어 옵니다.

```
GET https://api.github.com/repos/{owner}/{repo}/commits?sha=main&per_page=100
```

저장소 주소는 `assets/js/docs.js` 의 `REPO` 에 있습니다. 공개 저장소라 토큰은 필요 없지만,
그만큼 **IP 당 시간당 60회** 제한이 걸립니다. 그래서 버튼을 눌러 열 때 한 번만 부르고
캐시해 둡니다. 한도를 넘기면 안내 문구와 함께 GitHub 링크를 보여 줍니다.

커밋마다 한국 시각(`2026-09-01 12:30`), 상대 시각(`3일 전`), 제목, 본문,
짧은 해시(누르면 GitHub 커밋 화면)를 보여 줍니다.

새로 만든 커밋은 **푸시한 뒤에야** 목록에 나타납니다 — 로컬 커밋은 보이지 않습니다.

## 이미지 크게 보기

갤러리(`.gallery`)와 썸네일 카드(`.small-card`)의 그림은

- 마우스를 올리면 칸 안에서 살짝 확대되고,
- 누르면 뒷화면이 흐려지면서 원래 크기로 뜹니다. (`Esc`, 바깥 클릭, ✕ 로 닫기)

`assets/js/lightbox.js` 가 `document` 에서 클릭을 한 번만 받아 처리하므로, 문서 HTML 에는
아무것도 적지 않아도 됩니다. 크게 보기 창의 그림 아래 설명은 `<img>` 의 `alt` 를 그대로
쓰니 **`alt` 에 그림 내용을 적어 두세요.**

## 편집 제안 (EmailJS)

헤더의 **편집 제안** 버튼을 누르면 대화상자가 열리고, 보내면 페이지 안에서 바로 메일이
발송됩니다. 방문자의 메일 앱은 열리지 않습니다. 서버는 필요 없고 EmailJS 가 발송을 맡습니다.

`assets/js/docs.js` 의 `EMAIL` 에 대시보드 값 세 개를 넣으면 동작합니다.

```js
export const EMAIL = {
  publicKey: "7GRnS0Lk7LJ0ptiqL", // Account → General → Public Key
  serviceId: "service_vvp0san", // Email Services → Service ID
  templateId: "__ejs-test-mail-service__", // Email Templates → Template ID
};
```

- `publicKey` 는 공개돼도 되는 값입니다(브라우저에서 쓰라고 만든 키).
  **Private Key 는 절대 넣지 마세요** — 소스 보기로 그대로 노출됩니다.
- **받는 주소는 코드에 없습니다.** EmailJS 템플릿의 _To Email_ 에 설정하세요.
  그래야 메일 주소가 페이지에 노출되지 않습니다.
- EmailJS 대시보드에서 허용 도메인(Allowed Origins)을 배포 주소로 제한해 두면
  남이 키를 가져다 쓰는 것을 막을 수 있습니다.

템플릿이 쓰는 변수는 세 개입니다.

| 변수          | 내용                                  |
| ------------- | ------------------------------------- |
| `{{name}}`    | 작성자 (안 적으면 `(밝히지 않음)`)    |
| `{{message}}` | 문서·주소·종류 + 제안 내용            |
| `{{time}}`    | 보낸 시각 (작성자의 현지 시간)        |

`{{message}}` 는 여러 줄입니다. HTML 템플릿에서는 줄바꿈이 그냥 무시되므로 이렇게 감싸세요.

```html
<div style="white-space: pre-wrap">{{message}}</div>
```

낱개로 쓰고 싶으면 아래 값들도 함께 보내지고 있으니 템플릿에 바로 넣으면 됩니다 —
`{{doc_title}}` `{{doc_url}}` `{{type}}` `{{from}}` `{{site}}`.

## 다크 / 라이트 모드

우측 상단 버튼(🌙 / ☀️)으로 전환합니다.

- 고른 값은 `localStorage("wiki-theme")` 에 저장되어 다음 방문에도 유지됩니다.
- 고른 적이 없으면 OS 설정(`prefers-color-scheme`)을 따릅니다.
- 화면이 그려지기 전에 `index.html` 의 짧은 인라인 스크립트가 테마를 먼저 적용하므로
  다크 사용자에게 흰 화면이 번쩍이지 않습니다.

색은 전부 `assets/wiki.css` 맨 위 토큰으로만 정의합니다. **규칙 안에 색상값을 직접 쓰지 마세요.**
새 색이 필요하면 토큰을 추가하고 라이트/다크 두 곳에 값을 넣으면 됩니다.

## 문단 접기

`.main` 안의 `h2` / `h3` / `h4` / `h5` 는 자동으로 접었다 펼 수 있는 제목이 됩니다.
HTML 에 표시할 것은 없고, `wiki.js` 가 각 제목 아래 내용을 `.sec-body` 로 감쌉니다.

- 제목을 클릭하거나, 포커스한 뒤 `Enter` / `Space`.
- `h2` 를 접으면 그 아래 `h3` 문단들도 함께 접힙니다.
- 목차 링크나 `#앵커` 로 이동하면 접혀 있던 문단이 자동으로 펼쳐집니다. 검색도 마찬가지입니다.
- 문서 끝의 `.category`(분류) · `.footer` 는 어떤 문단에도 딸려 들어가지 않습니다.

## 용어 목록

밈·유행어처럼 "용어 + 설명" 짝이 이어지는 곳에 씁니다.

```html
<dl class="terms">
  <dt>짭메</dt>
  <dd>메이플스토리 본편을 가리키는 말.</dd>
</dl>
```

## 팬아트

이미지는 `assets/fanart/` 에 넣고, `docs/fanart.html` 의 `.gallery` 안에 `<figure>` 를
하나씩 더합니다. 칸 수는 화면 폭에 맞춰 자동으로 늘고 줄어듭니다.

```html
<div class="gallery">
  <figure class="art">
    <img
      src="assets/fanart/소재.webp"
      alt="즈키쿠 팬아트 — 소재 설명"
      loading="lazy"
    />
  </figure>
</div>
```

`alt` 에는 그림 내용을 적습니다 — 크게 보기 창에서 그림 아래 설명으로도 쓰입니다.
작가명을 함께 걸어야 할 때는 `<figcaption>작가명<span class="art-date">날짜</span></figcaption>`
을 `<figure>` 안에 더하면 됩니다.

게시 기준은 문서 3장에 적어 두었습니다 — 허락받은 그림만, 요청 시 즉시 삭제.

## 유튜브 영상

영상을 그대로 심지 않고 **썸네일 카드**로 보여 줍니다. 문서에는 링크 한 줄만 씁니다.

```html
<a class="yt" href="https://www.youtube.com/watch?v=ELLLR6egsNQ">즈키쿠 정규 1집</a>
```

`wiki.js` 가 유튜브 썸네일과 재생 표시를 채워 카드로 만들고, 누르면 새 탭에서 열립니다.
주소는 `watch?v=…` 와 `youtu.be/…` 둘 다 됩니다. 고화질 썸네일이 없는 영상은 자동으로
낮은 쪽으로 내려갑니다.

카드를 여러 장 늘어놓을 때는 `.ytgrid` 로 감쌉니다. 칸 수는 폭에 맞춰 저절로 늘고 줍니다.

```html
<div class="ytgrid">
  <a class="yt" href="…">첫 번째</a>
  <a class="yt" href="…">두 번째</a>
</div>
```

영상과 그에 딸린 내용(수록곡, 가사 한 줄)을 한 덩어리로 묶을 때는 `.release` 를 씁니다.
카드 안에서는 썸네일이 옆으로 눕습니다.

```html
<div class="release">
  <a class="yt" href="…">즈키쿠 정규 1집</a>
  <details class="fold">
    <summary>TRACK LIST</summary>
    <div class="fold-body">…</div>
  </details>
</div>
```

영상을 정말 문서 안에서 재생해야 한다면 `.video` 임베드도 그대로 있습니다.

```html
<div class="video">
  <iframe src="https://www.youtube-nocookie.com/embed/ELLLR6egsNQ" allowfullscreen></iframe>
</div>
```

## 인용

```html
<blockquote class="quote">치킨값도 안돼, 노작이면 어때</blockquote>

<!-- 출처를 붙일 때 -->
<blockquote class="quote">문구<cite>2025-11-03 방송</cite></blockquote>
```

왼쪽에 강조색 세로선이 붙고 본문보다 조금 큰 글씨로 표시됩니다.

## 각주

본문(`.main`) 안의 `<span class="note">…</span>` 는 자동으로 `[1]` `[2]` … 윗첨자가 되고,
마우스를 올리거나 포커스하면 내용이 툴팁으로 뜹니다.

```html
<p>
  대한민국의 인터넷 방송인.<span class="note"
    >본업이 따로 있으며 취미로 진행한다.</span
  >
</p>
```

본문과 인포박스를 모두 훑고, 문서에 나오는 순서대로 번호가 붙습니다. 번호 색은
`--fn` 토큰(#ec9f19)입니다.

각주로 바꾸지 않고 그냥 작은 회색 글씨로 둘 곳(항목 이름 등)에는 `.note-plain` 을 씁니다.

```html
<td>
  2025년 10월 16일<br /><span class="note-plain"
    >데뷔일<span class="elapsed" data-since="2025-10-16"></span
  ></span>
</td>
```

## 날짜 자동 계산

```html
데뷔일<span class="elapsed" data-since="2025-10-16"></span>
<!-- → 데뷔일 · 319일 경과 -->
```

미래 날짜면 `N일 남음` 으로 나옵니다.

## 파비콘

브랜드 색(`--accent` 민트) 바탕에 흰 「즈」를 얹은 사각 마크입니다.

```
assets/images/favicon-32.png     브라우저 탭
assets/images/favicon-180.png    iOS 홈 화면 (apple-touch-icon)
```

두 파일 모두 배경이 투명한 둥근 사각형이라 밝은 탭·어두운 탭 어디서나 같은 모양으로 보입니다.
다시 만들려면 원하는 크기의 정사각 `<div>` 하나를 headless Chrome 으로 캡처하면 됩니다 —
`--default-background-color=00000000` 을 주어야 모서리가 투명하게 나옵니다.

## 이미지 · 로고

- 이미지는 `assets/images/` 에 넣고 `<img src="assets/images/파일명.png">` 로 씁니다.
  시청자가 그려 준 팬아트만 `assets/fanart/` 로 따로 둡니다.
- 인포박스 이미지 칸과 썸네일 카드(`.small-card .img`)는 세로가 긴 그림도 잘리지 않게 늘어납니다.
- 인포박스 이미지는 기본적으로 칸 폭을 꽉 채웁니다. 원본이 작은 그림(채널 아바타 등)은
  몇 배로 늘어나 흐려지므로 `<img class="avatar">` 를 주면 240px 로 가운데 놓입니다.
- 플랫폼 로고는 `.platform-logo`, 심볼형(정사각형에 가까운) 로고는 `.mark` 를 함께 줍니다.
  한 칸에 계정이 여러 개면 각각 `.platform` 으로 묶고 사이에 `<span class="platform-sep">·</span>`.

> `.infobox .image` 에 `display:flex` 를 주면 안 됩니다. `<td>` 가 표 셀에서 빠져나가
> `colspan` 이 무시되고 이미지가 좁은 첫 열에만 들어갑니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions 가 저장소 루트를 그대로 GitHub Pages 로 배포합니다.
빌드 단계가 없으므로 `node_modules` 유무와 무관합니다.

처음 한 번은 GitHub 저장소 설정이 필요합니다:
**Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경.

배포 주소: `https://zkywiki.github.io/wiki/`

## 참고

이 페이지는 팬이 만든 비공식 문서입니다. 실린 정보는 방송·커뮤니티 공개 내용을 기준으로 하며,
본인이 공개하지 않은 개인 정보는 싣지 않습니다.
