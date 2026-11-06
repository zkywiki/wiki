/* 메이플 마우스 커서 (기본 / 클릭).
   원본 .cur/.ani 를 PNG 프레임으로 풀어 assets/cursor 에 두었다.
   브라우저는 .ani(움직이는 커서)를 지원하지 않으므로, 프레임을 번갈아
   CSS 변수(--cur-*)에 넣어 움직이게 한다. 실제 적용 규칙은 wiki.css 의
   body[data-cursor] 부분에 있다. */

/* 절대 주소로 만들어 둔다. CSS 변수 안의 상대 url() 은 Chrome 이 변수를 쓰는
   wiki.css 위치 기준으로 풀어서 assets/assets/... 로 잘못 찾기 때문. */
const DIR = new URL("assets/cursor/", document.baseURI).href;

/* 슬롯 이름 → 커서 정의. hot 은 핫스팟, ms 는 프레임마다 머무는 시간. */
const MAPLE = {
  default: { hot: [0, 0], frames: ["normal.png"], fallback: "default" },
  pointer: {
    hot: [0, 0],
    frames: ["link-0.png", "link-1.png"],
    ms: [517, 483],
    fallback: "pointer",
  },
};

/* 문서별로 다른 커서를 쓰고 싶으면 여기에 슬러그: 테마 를 넣는다.
   없는 문서는 DEFAULT_THEME 을 쓴다 (null 이면 브라우저 기본 커서). */
const THEMES = {};
const DEFAULT_THEME = MAPLE;

/* 슬롯마다 다음 프레임 타이머 하나씩. */
const timers = new Map();

function stop() {
  timers.forEach(clearTimeout);
  timers.clear();
  const s = document.body.style;
  Object.keys(MAPLE).forEach((k) => s.removeProperty(`--cur-${k}`));
  delete document.body.dataset.cursor;
}

function value(def, i) {
  return `url("${DIR}${def.frames[i]}") ${def.hot[0]} ${def.hot[1]}, ${def.fallback}`;
}

function play(name, def) {
  const prop = `--cur-${name}`;
  let i = 0;
  const step = () => {
    document.body.style.setProperty(prop, value(def, i));
    if (def.frames.length < 2) return;
    const wait = def.ms[i];
    i = (i + 1) % def.frames.length;
    timers.set(name, setTimeout(step, wait));
  };
  step();
}

export function setDocCursor(slug) {
  stop();
  const theme = slug in THEMES ? THEMES[slug] : DEFAULT_THEME;
  if (!theme) return;

  /* 프레임을 미리 받아 두어야 바뀔 때 깜빡이지 않는다. */
  Object.values(theme).forEach((d) =>
    d.frames.forEach((f) => (new Image().src = DIR + f)),
  );
  Object.entries(theme).forEach(([name, def]) => play(name, def));
  document.body.dataset.cursor = "on";
}
