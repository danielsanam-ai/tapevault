/* 첫 화면(index.html) 외의 페이지에서 버전 표기를 최신 릴리스로 맞춘다.
 * 출처는 release.js 와 같은 latest.json. 읽지 못하면 페이지에 적힌 기본 값을 그대로 둔다.
 * 대상: .nav-ver (상단 로고 옆), [data-tv-ver] (본문 속 "v1.x.x" 표기) */
(function () {
  fetch('https://danielsanam-ai.github.io/tapevault-releases/latest.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (!d || !/^\d+\.\d+\.\d+$/.test(d.version || '')) return;
      var v = 'v' + d.version;
      window.TV_VERSION = d.version;
      function paint() {
        document.querySelectorAll('.nav-ver, [data-tv-ver]').forEach(function (el) { el.textContent = v; });
      }
      paint();
      // 언어를 바꾸면 번역 문구가 다시 그려지므로 그 뒤에 한 번 더 맞춘다
      if (typeof window.applyLang === 'function') {
        var orig = window.applyLang;
        window.applyLang = function (lang) { orig(lang); paint(); };
      }
    })
    .catch(function () { /* 기본 값 유지 */ });
})();
