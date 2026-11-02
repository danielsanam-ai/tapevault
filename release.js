/* 최신 릴리스 정보를 읽어 다운로드 버튼·버전 표기를 갱신한다.
 * 출처: tapevault-releases 의 Pages (latest.json) — scripts/release.py 가 만들고 릴리스 게시 때 공개된다.
 * 읽기에 실패하면 아무것도 바꾸지 않는다 → 페이지에 적힌 기본 값(v1.0.0 버튼)이 그대로 동작한다. */
(function () {
  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var URL_LATEST = (LOCAL && new URLSearchParams(location.search).get('tvlatest')) ||
    'https://danielsanam-ai.github.io/tapevault-releases/latest.json';

  var isMac = /Mac/.test(navigator.platform || '') && !/iPhone|iPad|iPod/.test(navigator.userAgent || '') &&
    !(navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform) && /Mobile/.test(navigator.userAgent));

  var L = {
    en: { win: 'Windows', mac: 'macOS', dl: '⬇ Download TapeVault v{v} for Windows', macnote: 'v{v} · Apple Silicon (M1/M2/M3) only · ~{n} MB',
          sha: 'SHA-256', mb: 'MB', notes: 'Release notes', feat: 'Platform support', yes: '✓', no: '—',
          ver: 'v{v} · {d} · Requires {os}', foot: 'TapeVault v{v} · Built by Veteran IT · Billing by Paddle · No auto-renewal' },
    ko: { win: 'Windows', mac: 'macOS', dl: '⬇ TapeVault v{v} Windows용 다운로드', macnote: 'v{v} · Apple Silicon(M1/M2/M3) 전용 · ~{n} MB',
          sha: 'SHA-256', mb: 'MB', notes: '릴리스 노트', feat: '플랫폼별 지원 기능', yes: '✓', no: '—',
          ver: 'v{v} · {d} · {os} 필요', foot: 'TapeVault v{v} · Veteran IT 개발 · Paddle 결제 · 자동 갱신 없음' },
    ja: { win: 'Windows', mac: 'macOS', dl: '⬇ TapeVault v{v} Windows版をDL', macnote: 'v{v} · Apple Silicon (M1/M2/M3) 専用 · 約{n} MB',
          sha: 'SHA-256', mb: 'MB', notes: 'リリースノート', feat: 'プラットフォーム別の対応機能', yes: '✓', no: '—',
          ver: 'v{v} · {d} · {os}が必要', foot: 'TapeVault v{v} · Veteran IT製 · Paddle決済 · 自動更新なし' }
  };
  var LOCALE = { en: 'en-US', ko: 'ko-KR', ja: 'ja-JP' };
  var NAME = { windows: 'win', mac: 'mac' };

  // 최소 사양 문구 — latest.json 에는 언어와 무관한 값(os_name, min_os_version)만 두고 여기서 번역한다
  function osText(p, lang) {
    var n = p.os_name || '', v = p.min_os_version || '';
    if (!n || !v) return p.min_os || '';
    var arch = n === 'macOS' ? ' (Apple Silicon)' : ' (64-bit)';
    if (lang === 'ko') return n + ' ' + v + ' 이상' + arch;
    if (lang === 'ja') return n + ' ' + v + ' 以上' + arch;
    return n + ' ' + v + ' or later' + arch;
  }
  function fmt(s, o) { return s.replace(/\{(\w+)\}/g, function (_, k) { return o[k]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function valid(d) {
    if (!d || d.schema !== 1 || !/^\d+\.\d+\.\d+$/.test(d.version || '') || !d.platforms) return false;
    return Object.keys(d.platforms).every(function (k) {
      var p = d.platforms[k];
      return /^https:\/\/github\.com\/danielsanam-ai\/tapevault-releases\/releases\/download\//.test(p.url || '') && /^[0-9a-f]{64}$/.test(p.sha256 || '');
    }) && Object.keys(d.platforms).length > 0;
  }

  function apply(d) {
    var keys = Object.keys(d.platforms);                       // 'windows' | 'mac'
    var win = d.platforms.windows, mac = d.platforms.mac, both = !!(win && mac);

    // 1) 다운로드 주소: 버튼은 그대로 두고(보안 경고 팝업을 거친다) 팝업이 쓰는 주소만 바꾼다
    if (win) DOWNLOAD_URL = win.url;
    if (mac) DOWNLOAD_URL_MAC = mac.url;
    //    맥에서 열면 위쪽 "무료 체험" 버튼도 맥 파일로
    if (isMac && mac) {
      ['hero_btn1', 'cta_btn'].forEach(function (k) {
        var el = document.querySelector('[data-i18n="' + k + '"]');
        if (el) el.setAttribute('onclick', "showDownloadWarning('mac')");
      });
    }

    // 2) 번역 문구의 버전 표기 (스크린샷 캡션의 "v1.0.0" 은 실제 촬영 버전이라 건드리지 않는다)
    Object.keys(L).forEach(function (lang) {
      if (typeof T === 'undefined' || !T[lang]) return;
      var t = L[lang];
      var date = new Date(d.date + 'T00:00:00').toLocaleDateString(LOCALE[lang], { year: 'numeric', month: 'long' });
      if (win) {
        T[lang].dl_btn = fmt(t.dl, { v: d.version });
        T[lang].dl_ver = fmt(t.ver, { v: d.version, d: date, os: osText(win, lang) });
        T[lang].dl_s3 = '~' + Math.round(win.size / 1048576) + ' MB';
      }
      if (mac) T[lang].dl_mac_note = fmt(t.macnote, { v: d.version, n: Math.round(mac.size / 1048576) });
      T[lang].foot_bottom = fmt(t.foot, { v: d.version });
    });
    var nav = document.querySelector('.nav-ver');
    if (nav) nav.textContent = 'v' + d.version;

    // 3) 체크섬 + 기능 표 (언어를 바꾸면 다시 그린다)
    function more() {
      var host = document.getElementById('dl-more');
      if (!host) return;
      var lang = (localStorage.getItem('tv-lang') || 'en'), t = L[lang] || L.en;
      var rows = keys.map(function (k) {
        var p = d.platforms[k];
        return '<div class="dl-row"><a href="' + esc(p.url) + '" rel="noopener">' + esc(t[NAME[k]]) + ' · ' + esc(p.file) +
          '</a> <span>' + Math.round(p.size / 1048576) + ' ' + t.mb + ' · ' + esc(osText(p, lang)) + '</span><code title="' + t.sha + '">' +
          t.sha + ' ' + esc(p.sha256.slice(0, 16)) + '…</code></div>';
      }).join('');
      var feats = '';
      if (d.features && d.features.length && both) {
        feats = '<details class="dl-feat"><summary>' + t.feat + '</summary><table>' + d.features.map(function (f) {
          return '<tr><td>' + esc(f[lang] || f.en) + '</td><td>' + (f.windows ? t.yes : t.no) + '</td><td>' + (f.mac ? t.yes : t.no) + '</td></tr>';
        }).join('') + '</table></details>';
      }
      host.innerHTML = rows + (d.page ? '<div class="dl-row"><a href="' + esc(d.page) + '" rel="noopener">' + t.notes + ' →</a></div>' : '') + feats;
      host.hidden = false;
    }
    if (typeof applyLang === 'function') {
      var orig = applyLang;
      window.applyLang = function (lang) { orig(lang); more(); };
      window.applyLang(localStorage.getItem('tv-lang') || 'en');
    } else {
      more();
    }
    window.TV_RELEASE = d;
  }

  fetch(URL_LATEST, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { if (valid(d)) apply(d); else console.warn('[release] latest.json 형식이 올바르지 않아 무시합니다'); })
    .catch(function (e) { console.warn('[release] 최신 버전 정보를 읽지 못했습니다 (기본 값 사용):', e && e.message); });
})();
