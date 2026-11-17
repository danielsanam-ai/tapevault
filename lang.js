/* 처음 보여 줄 언어를 정한다. 각 페이지가 applyLang(tvInitialLang()) 으로 쓴다.
 * 우선순위:
 *   1) 주소의 ?lang=ko|en|ja            (광고·메일 링크에서 언어를 고정할 때. 선택으로 기억한다)
 *   2) 방문자가 언어 메뉴에서 직접 고른 값 (localStorage 'tv-lang' + 'tv-lang-set')
 *   3) 이번 방문에서 이미 정한 값        (sessionStorage — 페이지를 옮겨도 같은 언어)
 *   4) 네이버·다음·카카오에서 들어온 경우 한국어
 *   5) 브라우저 언어 설정 (ko → 한국어, ja → 일본어, 그 외 영어)
 * 예전에는 첫 방문 때 무조건 영어를 저장했기 때문에, 직접 고른 표시(tv-lang-set)가 없는 저장 값은 믿지 않는다. */
(function () {
  var OK = { en: 1, ko: 1, ja: 1 };
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function norm(s) { s = String(s || '').toLowerCase().slice(0, 2); return OK[s] ? s : null; }

  function detect() {
    var ref = '';
    try { ref = new URL(document.referrer).hostname; } catch (e) {}
    if (/(^|\.)(naver\.com|daum\.net|kakao\.com)$/.test(ref)) return 'ko';
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) { var l = norm(list[i]); if (l) return l; }
    return 'en';
  }

  window.tvInitialLang = function () {
    var q = null;
    try { q = norm(new URLSearchParams(location.search).get('lang')); } catch (e) {}
    if (q) { ls('tv-lang-set', '1'); ss('tv-lang-auto', q); return q; }
    var saved = norm(ls('tv-lang'));
    if (saved && ls('tv-lang-set') === '1') return saved;
    var auto = norm(ss('tv-lang-auto'));
    if (!auto) { auto = detect(); ss('tv-lang-auto', auto); }
    return auto;
  };

  // 언어 메뉴·푸터의 언어 링크를 누르면 "직접 고른 값"으로 표시한다
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('.lang-menu-item, [onclick*="applyLang("]') : null;
    if (el) { ls('tv-lang-set', '1'); }
  }, true);
})();
