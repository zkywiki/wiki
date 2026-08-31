# zkywiki

치지직 스트리머 **즈키쿠** 팬 위키 스타일 정적 웹페이지.

빌드 도구 없이 HTML 파일 하나로 동작합니다. 브라우저로 `index.html` 을 열면 바로 보입니다.

## 구조

```
.
├── index.html                  # 문서 본문 (CSS·JS 인라인 포함)
├── assets/                     # 문서에서 쓰는 이미지
├── .nojekyll                   # GitHub Pages 의 Jekyll 처리 비활성화
└── .github/workflows/deploy.yml  # main 푸시 시 Pages 자동 배포
```

## 로컬에서 보기

파일을 더블클릭해도 되지만, 로컬 서버로 띄우면 경로/캐시 문제가 없습니다.

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## 이미지 추가하기

1. 이미지를 `assets/` 에 넣습니다. (예: `assets/즈키쿠_빵떡이.png`)
2. `index.html` 의 인포박스 `.image` 칸을 `<img>` 로 바꿉니다.

```html
<td class="image" colspan="2">
  <img src="assets/즈키쿠_빵떡이.png" alt="즈키쿠" style="width:100%;height:100%;object-fit:cover">
</td>
```

## 문서 수정하기

- 본문 문단은 `index.html` 의 `<section class="main">` 안에 있습니다.
- 새 문단(`<h2 id="...">`)을 추가하면 상단 목차(`.toc`)에도 같은 `id` 로 링크를 넣어 주세요.
- 우측 인포박스는 `<table class="infobox">` 입니다.
- 상단 검색창은 현재 문서 안의 텍스트만 찾아 하이라이트합니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Actions 가 저장소 루트를 그대로 GitHub Pages 로 배포합니다.

처음 한 번은 GitHub 저장소 설정이 필요합니다:
**Settings → Pages → Build and deployment → Source** 를 **GitHub Actions** 로 변경.

배포 주소: `https://zkywiki.github.io/wiki/`

## 참고

이 페이지는 팬이 만든 비공식 문서입니다. 실린 정보는 방송·커뮤니티 공개 내용을 기준으로 하며,
본인이 공개하지 않은 개인 정보는 싣지 않습니다.
