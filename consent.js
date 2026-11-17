/* Google 태그(Google Tag Manager) — 방문자가 동의한 뒤에만 불러온다.
 * 동의 전·거부 시에는 Google 로 어떤 요청도 보내지 않고 쿠키도 만들지 않는다.
 * 선택은 localStorage 'tv-consent' ('granted' | 'denied') 에 저장하고, 푸터의 "쿠키 설정" 링크로 언제든 바꿀 수 있다.
 * 로그인·구매 페이지에는 넣지 않는다(계정·결제 정보가 있는 화면). */
(function () {
  var GTM_ID = 'GTM-PSCRJSDG', KEY = 'tv-consent', loaded = false, bar = null, link = null;

  var L = {
    en: { text: 'We use Google tags to measure visits and the performance of our ads. They load only if you accept.',
          more: 'Privacy Policy', yes: 'Accept', no: 'Decline', settings: 'Cookie settings', label: 'Cookie consent' },
    ko: { text: '방문 통계와 광고 성과 측정을 위해 Google 태그를 사용합니다. 동의하신 경우에만 불러옵니다.',
          more: '개인정보처리방침', yes: '동의', no: '거부', settings: '쿠키 설정', label: '쿠키 동의' },
    ja: { text: 'アクセス状況と広告効果の測定のためにGoogleタグを使用します。同意いただいた場合にのみ読み込みます。',
          more: 'プライバシーポリシー', yes: '同意する', no: '拒否する', settings: 'Cookie設定', label: 'Cookieの同意' }
  };
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function t() { return L[get('tv-lang')] || L.en; }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function load() {
    if (loaded) return;
    loaded = true;
    gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    gtag('js', new Date());
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(s);
  }

  // 거부로 바꾸면 Google 이 만든 1st-party 쿠키(_ga, _gid, _gcl…)를 지운다
  function clearCookies() {
    var host = location.hostname, domains = ['', host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^_(ga|gid|gcl|gat)/.test(name)) return;
      domains.forEach(function (d) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }

  function choose(v) {
    set(KEY, v);
    hide();
    if (v === 'granted') { load(); return; }
    clearCookies();
    if (loaded) location.reload();   // 이미 불러온 태그를 멈추려면 새로 고쳐야 한다
  }

  function hide() { if (bar) { bar.remove(); bar = null; } }

  function show() {
    hide();
    var s = t();
    bar = document.createElement('div');
    bar.id = 'tv-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', s.label);
    bar.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:0 auto;' +
      'background:#30343e;border:1px solid #505667;border-radius:12px;padding:14px 16px;display:flex;flex-wrap:wrap;' +
      'align-items:center;gap:12px;box-shadow:0 10px 40px rgba(0,0,0,.55);font:13px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#c8cfe0';
    var p = document.createElement('div');
    p.style.cssText = 'flex:1 1 280px;min-width:0';
    p.appendChild(document.createTextNode(s.text + ' '));
    var a = document.createElement('a');
    a.href = 'privacy-policy.html#cookies';
    a.textContent = s.more;
    a.style.cssText = 'color:#7db2ff;text-decoration:underline';
    p.appendChild(a);
    var box = document.createElement('div');
    box.style.cssText = 'display:flex;gap:8px;flex:0 0 auto;margin-left:auto';
    function btn(label, primary, v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'cursor:pointer;border-radius:8px;padding:8px 16px;font:600 13px system-ui,-apple-system,"Segoe UI",sans-serif;' +
        (primary ? 'background:#f5a623;color:#30343e;border:1px solid #f5a623' : 'background:transparent;color:#c8cfe0;border:1px solid #5c6274');
      b.onclick = function () { choose(v); };
      return b;
    }
    box.appendChild(btn(s.no, false, 'denied'));
    box.appendChild(btn(s.yes, true, 'granted'));
    bar.appendChild(p);
    bar.appendChild(box);
    document.body.appendChild(bar);
  }

  function footerLink() {
    var host = document.querySelector('.footer-right') || document.querySelector('.footer-bottom') || document.querySelector('footer');
    if (!host) return;
    link = document.createElement('a');
    link.href = '#';
    link.id = 'tv-consent-link';
    link.textContent = t().settings;
    link.style.cssText = 'color:inherit;font-size:12px;text-decoration:underline;margin-left:14px;cursor:pointer';
    link.onclick = function (e) { e.preventDefault(); show(); };
    host.appendChild(link);
  }

  function init() {
    footerLink();
    var v = get(KEY);
    if (v === 'granted') load();
    else if (v !== 'denied') show();
    // 언어를 바꾸면 배너·링크 문구도 바꾼다
    if (typeof window.applyLang === 'function') {
      var orig = window.applyLang;
      window.applyLang = function (lang) {
        orig(lang);
        if (link) link.textContent = t().settings;
        if (bar) show();
      };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
