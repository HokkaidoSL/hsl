/* 体験版：画面がサーバー（Apps Script）を呼ぶところを、ブラウザの中で受ける
 *  ・読み込み（試合の一覧・試合の情報など）は data.js の返り値を返す（本物のプログラムで作ったもの）
 *  ・保存・提出・メールは、どこにも送らず「体験版です」と返す
 *  ・試合の日付は、開いた日（今日）に置きかえる
 */
(function () {
  'use strict';
  var D = window.DEMO_DATA || { calls: {} };
  var t = new Date(), today = t.getFullYear() + '-' + ('0' + (t.getMonth() + 1)).slice(-2) + '-' + ('0' + t.getDate()).slice(-2);
  var calls = JSON.parse(JSON.stringify(D.calls).split(D.day).join(today));
  var hhmm = function () { var n = new Date(); return ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2); };
  var DEMO = '（体験版のため、保存・送信はしていません）';
  var write = {
    saveRecordDraft: function () { return { ok: true, savedAt: hhmm() }; },
    deleteRecordDraft: function () { return { ok: true }; },
    submitOfficialRecordV2: function (p) { return { ok: true, recordId: 'OR-DEMO-' + Date.now().toString(36).toUpperCase(), version: 1, message: '公式記録を提出し、承認依頼を作成しました。' + DEMO }; },
    sendRefereeTestMail: function (to) { return { ok: true, message: to + ' へのテストメール' + DEMO }; },
    officialIncidentSave: function () { return { ok: true, message: '問題事項報告書を提出しました。' + DEMO }; },
    submitRefereeReport: function (p) { return { ok: true, found: true, reportId: 'RR-DEMO', message: '審判報告書を提出しました。' + DEMO }; },
    refereeReportCheck: function () { return { found: true, reportId: 'RR-DEMO', message: '審判報告書を提出しました。' + DEMO }; }
  };
  function answer(fn, args) {
    if (write[fn]) return write[fn].apply(null, args);
    var k = fn + JSON.stringify(args);
    if (calls.hasOwnProperty(k)) return JSON.parse(JSON.stringify(calls[k]));
    if (fn === 'incidentSummary') return { count: 0, kinds: '' };
    throw new Error('体験版では使えない機能です（' + fn + '）');
  }
  function runner(ok, ng, user) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, ng, user); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f, user); };
        if (name === 'withUserObject') return function (u) { return runner(ok, ng, u); };
        return function () {
          var args = Array.prototype.slice.call(arguments);
          setTimeout(function () {
            var r, err = null;
            try { r = answer(String(name), JSON.parse(JSON.stringify(args))); } catch (e) { err = e; }
            if (err) { if (ng) ng(err, user); else console.error(err); } else if (ok) ok(r, user);
          }, 250 + Math.random() * 300);
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = { run: runner(null, null, undefined), host: { close: function () {}, setHeight: function () {} }, url: { getLocation: function (f) { var q = {}; new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); setTimeout(function () { f({ parameter: q, hash: '' }); }, 0); } } };

  // 画面のいちばん上に「体験版」の帯を出す
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('div');
    b.setAttribute('style', 'position:sticky;top:0;z-index:9999;background:#F6E14F;color:#18252e;font:700 13px/1.5 "Noto Sans JP",sans-serif;padding:8px 12px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.15)');
    b.innerHTML = '体験版です。自由にさわってください。入力しても、どこにも保存・送信されません。　<a href="./" style="color:#1d6fa5">体験版のはじめに戻る</a>';
    document.body.insertBefore(b, document.body.firstChild);
  });
})();
