/* 体験版：画面とエンジン（worker.js）をつなぐ
 *  ・google.script.run の呼び出しを、ブラウザの中のエンジンに回す（本物のサーバーには送らない）
 *  ・画面の時計を、体験版の日付に合わせる
 */
(function () {
  'use strict';
  var here = location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  var BASE = here + 'run.html';
  var V = ((document.currentScript && document.currentScript.src || '').match(/[?&]v=([^&]+)/) || [])[1] || '';
  var W = new Worker(here + 'worker.js?v=' + V);
  var seq = 0, wait = {};
  var RD = Date, off = 0;
  function setClock(c) {
    if (!c || !c.day) return;
    var v = RD.parse(c.day + 'T' + (c.time || '09:00') + ':00+09:00') + Math.max(0, RD.now() - (c.setAt || RD.now()));
    off = v - RD.now();
    window.DEMO_CLOCK = c;
  }
  function VD() {
    var a = Array.prototype.slice.call(arguments);
    if (!(this instanceof VD)) return new RD(RD.now() + off).toString();
    if (!a.length) return new RD(RD.now() + off);
    return new (Function.prototype.bind.apply(RD, [null].concat(a)))();
  }
  VD.now = function () { return RD.now() + off; }; VD.UTC = RD.UTC; VD.parse = RD.parse; VD.prototype = RD.prototype;
  window.Date = VD;
  W.onmessage = function (e) {
    var d = e.data, w = wait[d.id];
    delete wait[d.id];
    if (d.clock) setClock(d.clock);
    if (!w) return;
    if (d.ok) w[0](d.result); else { var er = new Error(d.error); er.stack = d.stack || ''; if (window.console) console.warn('体験版：', d.error, d.stack || ''); w[1](er); }
  };
  W.onerror = function (e) { if (window.console) console.error('体験版のエンジンが止まりました', e.message); };
  function rpc(kind, fn, args) {
    return new Promise(function (ok, ng) { var id = ++seq; wait[id] = [ok, ng]; W.postMessage({ id: id, kind: kind, fn: fn, args: args || [], base: BASE }); });
  }
  window.DEMO_RPC = rpc;
  window.DEMO_CALL = function (fn) { return rpc('call', fn, Array.prototype.slice.call(arguments, 1)); };
  window.DEMO_BASE = BASE;

  function runner(ok, ng, user) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, ng, user); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f, user); };
        if (name === 'withUserObject') return function (u) { return runner(ok, ng, u); };
        if (typeof name !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          rpc('call', name, args).then(function (r) { if (ok) ok(r, user); }, function (e) { if (ng) ng(e, user); else if (window.console) console.error(e); });
        };
      }
    });
  }
  var params = function () { var q = {}; new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); return q; };
  window.google = { script: {
    run: runner(null, null, undefined),
    host: { close: function () {}, setHeight: function () {}, setWidth: function () {}, editor: { focus: function () {} }, origin: location.origin },
    url: { getLocation: function (f) { var q = params(), ps = {}; Object.keys(q).forEach(function (k) { ps[k] = [q[k]]; }); setTimeout(function () { f({ parameter: q, parameters: ps, hash: location.hash.slice(1) }); }, 0); } },
    history: { push: function () {}, replace: function () {}, setChangeHandler: function () {} }
  } };

  var WD = ['日', '月', '火', '水', '木', '金', '土'];
  window.DEMO_DAYTEXT = function (c) { c = c || window.DEMO_CLOCK; if (!c) return ''; var p = c.day.split('-'); var d = new RD(Date.UTC(+p[0], +p[1] - 1, +p[2])); return (+p[0]) + '年' + (+p[1]) + '月' + (+p[2]) + '日（' + WD[d.getUTCDay()] + '）'; };

  /** run.html：本物の画面（doGet）を出す */
  window.DEMO_BOOT = function () {
    rpc('doGet', null, [params()]).then(function (r) {
      var html = String(r.html || '');
      var bar = '<div id="demo-bar" style="position:sticky;top:0;z-index:2147483000;background:#F6E14F;color:#18252e;font:700 13px/1.5 \'Noto Sans JP\',sans-serif;padding:7px 10px;display:flex;gap:8px;align-items:center;justify-content:space-between;box-shadow:0 1px 4px rgba(0,0,0,.18)">' +
        '<span>体験版　<span style="font-weight:400">' + window.DEMO_DAYTEXT() + '</span></span>' +
        '<a href="./" style="background:#18252e;color:#fff;text-decoration:none;border-radius:6px;padding:4px 10px;white-space:nowrap">案内に戻る</a></div>';
      html = html.replace(/^\s*<!doctype[^>]*>/i, '');
      if (/<body[^>]*>/i.test(html)) html = html.replace(/<body[^>]*>/i, function (m) { return m + bar; });
      else html = bar + html;
      var head = '<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="robots" content="noindex,nofollow"><title>【体験版】' + (r.title || '') + '</title>';
      document.open(); document.write(head + html); document.close();
    }, function (e) {
      document.body.innerHTML = '<div style="font-family:sans-serif;padding:20px;line-height:1.8"><h2>画面を開けませんでした</h2><p>' + String(e.message).replace(/</g, '&lt;') + '</p><p><a href="./">体験版の案内に戻る</a></p></div>';
    });
  };
})();
