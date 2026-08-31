/* ============================================================
   wiki.js — 위키 문서 공통 스크립트

   <head> 에 아래 한 줄로 불러온다.
     <script src="assets/wiki.js" defer></script>

   기능
   1) 테마 토글 : <button class="theme-toggle"></button> 를 두면 알아서 동작한다.
                 선택값은 localStorage("wiki-theme")에 저장되고,
                 고른 적이 없으면 OS 설정(prefers-color-scheme)을 따른다.
                 깜빡임(FOUC) 방지용 짧은 스크립트가 문서 <head> 에 따로 들어있다.
   2) 문서 내 검색 : <input id="q"> 에서 Enter → 첫 번째 일치 지점을 표시하고 스크롤.
   3) 문단 접기   : .main 안의 h2/h3/h4 를 누르면 그 문단이 접히고 펴진다.
                 HTML 은 그대로 두고 스크립트가 문단 내용을 감싸므로,
                 새 문단을 추가해도 따로 손댈 것이 없다.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. 테마 ---------- */
  var KEY = 'wiki-theme';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }   // 사생활 보호 모드 등
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* 저장 실패해도 동작엔 지장 없음 */ }
  }
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  /* 지금 화면에 적용 중인 테마 */
  function currentTheme() {
    return root.getAttribute('data-theme') || (systemPrefersDark() ? 'dark' : 'light');
  }

  function paintToggle() {
    var dark = currentTheme() === 'dark';
    var label = dark ? '라이트 모드로 전환' : '다크 모드로 전환';
    var buttons = document.querySelectorAll('.theme-toggle');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].textContent = dark ? '☀️' : '🌙';   // 누르면 바뀔 방향이 아니라 '현재' 상태 표시
      buttons[i].setAttribute('aria-label', label);
      buttons[i].setAttribute('title', label);
    }
  }

  function toggleTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    save(next);
    paintToggle();
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.theme-toggle');
    if (btn) toggleTheme();
  });

  /* 직접 고른 적이 없으면 OS 설정 변화를 그대로 따라간다. */
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function () { if (!stored()) paintToggle(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- 2. 문서 내 검색 ---------- */
  function doSearch() {
    var input = document.getElementById('q');
    var article = document.querySelector('.article');
    if (!input || !article) return;

    var q = input.value.trim();
    if (!q) return;

    /* 이전 하이라이트 제거 */
    var marks = article.querySelectorAll('mark');
    for (var i = 0; i < marks.length; i++) {
      var m = marks[i];
      m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
    }
    article.normalize();

    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (var j = 0; j < nodes.length; j++) {
      var n = nodes[j];
      var idx = n.nodeValue.toLowerCase().indexOf(q.toLowerCase());
      if (idx < 0) continue;

      var span = document.createElement('span');
      span.appendChild(document.createTextNode(n.nodeValue.slice(0, idx)));
      var mark = document.createElement('mark');
      mark.textContent = n.nodeValue.slice(idx, idx + q.length);
      span.appendChild(mark);
      span.appendChild(document.createTextNode(n.nodeValue.slice(idx + q.length)));
      n.parentNode.replaceChild(span, n);

      revealNode(mark);
      mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'q') {
      e.preventDefault();
      doSearch();
    }
  });

  /* ---------- 3. 문단 접기 ---------- */
  var LEVEL = { H2: 2, H3: 3, H4: 4 };

  /* 문단에 포함시키면 안 되는 꼬리 블록 (분류·푸터) */
  function isTail(el) {
    return el.classList && (el.classList.contains('category') || el.classList.contains('footer'));
  }

  function setupSections() {
    var main = document.querySelector('.article .main') || document.querySelector('.article');
    if (!main) return;

    /* 감싸기 전에 제목 목록을 먼저 확보한다 (아래에서 DOM 을 옮기기 때문) */
    var headings = [];
    for (var i = 0; i < main.children.length; i++) {
      if (LEVEL[main.children[i].tagName]) headings.push(main.children[i]);
    }

    headings.forEach(function (h) {
      var level = LEVEL[h.tagName];

      /* 다음 '같거나 더 높은 단계'의 제목 직전까지가 이 문단의 내용.
         h2 를 접으면 그 아래 h3 문단들도 함께 접힌다. */
      var body = document.createElement('div');
      body.className = 'sec-body';
      var n = h.nextSibling;
      while (n) {
        var next = n.nextSibling;
        if (n.nodeType === 1 && (LEVEL[n.tagName] <= level || isTail(n))) break;
        body.appendChild(n);
        n = next;
      }
      if (!body.childNodes.length) return;   // 내용이 없으면 접을 것도 없다

      h.parentNode.insertBefore(body, h.nextSibling);

      h.classList.add('sec-head');
      h.setAttribute('role', 'button');
      h.setAttribute('tabindex', '0');
      h.setAttribute('aria-expanded', 'true');
      h.__body = body;
    });
  }

  function setSection(h, open) {
    if (!h.__body) return;
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
    h.__body.hidden = !open;
  }

  document.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('.sec-head');
    if (!h || e.target.closest('a')) return;   // 제목 안의 링크 클릭은 그대로 링크로
    setSection(h, h.getAttribute('aria-expanded') === 'false');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var h = e.target.closest && e.target.closest('.sec-head');
    if (!h) return;
    e.preventDefault();
    setSection(h, h.getAttribute('aria-expanded') === 'false');
  });

  /* 접혀 있는 문단으로 이동할 때(목차 클릭, #앵커 링크) 자동으로 펼친다. */
  function revealTarget(id) {
    var el = id && document.getElementById(id);
    if (!el) return;

    if (el.classList.contains('sec-head')) setSection(el, true);

    var node = el.parentNode;
    while (node && node !== document.body) {
      if (node.classList && node.classList.contains('sec-body') && node.hidden) {
        var head = node.previousElementSibling;
        if (head && head.classList.contains('sec-head')) setSection(head, true);
        else node.hidden = false;
      }
      node = node.parentNode;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (!id) return;
    e.preventDefault();
    revealTarget(id);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  /* 검색 결과가 접힌 문단 안에 있으면 그 문단을 펼친다. */
  function revealNode(node) {
    var p = node.parentNode;
    while (p && p !== document.body) {
      if (p.classList && p.classList.contains('sec-body') && p.hidden) {
        var head = p.previousElementSibling;
        if (head && head.classList.contains('sec-head')) setSection(head, true);
        else p.hidden = false;
      }
      p = p.parentNode;
    }
  }

  /* ---------- 초기화 ---------- */
  paintToggle();
  setupSections();
  if (location.hash) revealTarget(decodeURIComponent(location.hash.slice(1)));
})();
