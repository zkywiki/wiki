# zkywiki

치지직 스트리머 **즈키쿠** 팬 위키 스타일 정적 웹페이지.

빌드 과정이 없습니다. 저장소의 파일이 그대로 배포되고, `index.html` 을 브라우저로 열면 바로 보입니다.
(개발 편의를 위한 vite 는 로컬 개발 서버 용도로만 씁니다. 배포에는 관여하지 않습니다.)

## 구조

```
.
├── index.html                    # 문서 본문
├── assets/
│   ├── wiki.css                  # 공통 스타일 + 테마 색상 토큰
│   ├── wiki.js                   # 테마 토글, 문서 내 검색
│   └── (이미지 파일)
├── package.json / vite.config.js # 로컬 개발 서버(HMR) 전용
├── .nojekyll                     # GitHub Pages 의 Jekyll 처리 비활성화
└── .github/workflows/deploy.yml  # main 푸시 시 Pages 자동 배포
```

## 로컬 실행

### 개발할 때 (권장) — 저장하면 바로 반영

```bash
npm install     # 최초 1회
npm run dev     # http://localhost:5173 자동으로 열림
```

- `assets/wiki.css` 저장 → **새로고침 없이** 스타일만 교체됩니다. 스크롤 위치도 그대로.
- `index.html`, `assets/wiki.js` 저장 → 브라우저가 자동으로 새로고침됩니다.
- 중단은 `Ctrl+C`.

> Node 20.12 기준으로 vite 6 에 고정해 두었습니다. Node 를 20.19+ 또는 22 LTS 로 올리면
> `npm install -D vite@latest` 로 최신 버전을 쓸 수 있습니다.

### 그냥 보기만 할 때

```bash
open index.html            # 파일 그대로 열기
# 또는
python3 -m http.server 8000    # http://localhost:8000
```

## 다크 / 라이트 모드

우측 상단 버튼(🌙 / ☀️)으로 전환합니다.

- 고른 값은 `localStorage("wiki-theme")` 에 저장되어 다음 방문에도 유지됩니다.
- 고른 적이 없으면 OS 설정(`prefers-color-scheme`)을 따릅니다.
- 화면이 그려지기 전에 `<head>` 의 짧은 스크립트가 테마를 먼저 적용하므로, 다크 사용자에게
  흰 화면이 번쩍이지 않습니다.

색은 전부 `assets/wiki.css` 맨 위 토큰으로만 정의합니다. **규칙 안에 색상값을 직접 쓰지 마세요.**
새 색이 필요하면 토큰을 추가하고 라이트/다크 두 곳에 값을 넣으면 됩니다.

```css
:root{ --bg:#f6f7f8; ... }                                  /* 라이트 */
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){ ... } }  /* OS 다크 */
:root[data-theme="dark"]{ ... }                             /* 토글로 고른 다크 */
```

## 문단 접기

`.main` 안의 `h2` / `h3` / `h4` 는 자동으로 접었다 펼 수 있는 제목이 됩니다. HTML 에 표시할 것은 없고,
`wiki.js` 가 각 제목 아래 내용을 `.sec-body` 로 감싸고 제목에 ▼/▶ 표시를 붙입니다.

- 제목을 클릭하거나, 포커스한 뒤 `Enter` / `Space`.
- `h2` 를 접으면 그 아래 `h3` 문단들도 함께 접힙니다.
- 목차 링크나 `#앵커` 로 이동하면 접혀 있던 문단이 자동으로 펼쳐집니다. 검색 결과도 마찬가지입니다.
- 문서 끝의 `.category`(분류) · `.footer` 는 어떤 문단에도 딸려 들어가지 않습니다.

## 각주

본문(`.main`) 안의 `<span class="note">…</span>` 는 자동으로 `[1]` `[2]` … 윗첨자가 되고,
마우스를 올리거나 키보드로 포커스하면 내용이 툴팁으로 뜹니다. HTML 은 그대로 두면 됩니다.

```html
<p>대한민국의 인터넷 방송인.<span class="note">본업이 따로 있으며 취미로 진행한다.</span></p>
<!-- → 대한민국의 인터넷 방송인.[1]  (마우스 오버 시 툴팁) -->
```

번호 색은 `--fn` 토큰(#ec9f19)입니다. 인포박스 등 본문 밖의 `.note` 는 각주가 아니라
항목 설명이므로 그대로 둡니다.

## 날짜 자동 계산

경과 일수는 문서에 적어 두지 말고 `data-since` 로 두면 열 때마다 오늘 기준으로 다시 계산됩니다.

```html
데뷔일<span class="elapsed" data-since="2025-10-16"></span>
<!-- → 데뷔일 · 319일 경과 -->
```

미래 날짜면 `N일 남음` 으로 나옵니다. 자바스크립트가 꺼져 있으면 비어 있고, 앞의 구분점도 나오지 않습니다.

## 스타일 · 스크립트 붙이기

새 문서를 만들 때 `<head>` 에 아래를 넣으면 됩니다. (`docs/` 같은 하위 폴더면 `../assets/...`)

```html
<link rel="stylesheet" href="assets/wiki.css" />
<script src="assets/wiki.js" defer></script>
<!-- 테마 깜빡임 방지: index.html 의 <head> 인라인 스크립트도 함께 복사 -->
```

자주 쓰는 클래스는 `wiki.css` 안에 섹션별 주석으로 사용법이 적혀 있습니다 —
`.topbar` / `.article` / `.layout` / `.infobox` / `.toc` / `.fold` / `.question` / `.small-card` / `.category`.

## 이미지 추가하기

1. 이미지를 `assets/` 에 넣습니다. (예: `assets/즈키쿠_빵떡이.png`)
2. 인포박스 `.image` 칸에 `<img>` 를 넣습니다. 크기는 CSS 가 맞춰 줍니다.

```html
<td class="image" colspan="2">
  <img src="assets/즈키쿠_빵떡이.png" alt="즈키쿠" />
</td>
```

> `.infobox .image` 에 `display:flex` 를 주면 안 됩니다. `<td>` 가 표 셀에서 빠져나가
> `colspan` 이 무시되고 이미지가 좁은 첫 열에만 들어갑니다.

썸네일 카드(`.small-card .img`)와 인포박스 이미지 칸은 세로가 긴 그림도 잘리지 않게 늘어납니다.

플랫폼 로고는 `.platform-logo` 를 씁니다. 가로로 긴 워드마크는 그대로, 심볼형(정사각형에 가까운)
로고는 `.mark` 를 함께 주면 크기가 맞습니다. 한 칸에 계정이 여러 개면 각각 `.platform` 으로 묶고
사이에 `<span class="platform-sep">·</span>` 을 넣습니다.

```html
<span class="platform">
  <img class="platform-logo mark" src="assets/youtube.svg" alt="YouTube" />@즈키쿠
</span>
<span class="platform-sep">·</span>
<span class="platform">
  <img class="platform-logo mark" src="assets/youtube.svg" alt="YouTube" />@쿠포티파이
</span>
```

## 문서 수정하기

- 본문 문단은 `index.html` 의 `<section class="main">` 안에 있습니다.
- 새 문단(`<h2 id="...">`)을 추가하면 상단 목차(`.toc`)에도 같은 `id` 로 링크를 넣어 주세요.
- 우측 인포박스는 `<table class="infobox">` 입니다.
- 상단 검색창은 현재 문서 안의 텍스트만 찾아 하이라이트합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions 가 저장소 루트를 그대로 GitHub Pages 로 배포합니다.
빌드 단계가 없으므로 `node_modules` 유무와 무관합니다.

처음 한 번은 GitHub 저장소 설정이 필요합니다:
**Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경.

배포 주소: `https://zkywiki.github.io/wiki/`

## 참고

이 페이지는 팬이 만든 비공식 문서입니다. 실린 정보는 방송·커뮤니티 공개 내용을 기준으로 하며,
본인이 공개하지 않은 개인 정보는 싣지 않습니다.
