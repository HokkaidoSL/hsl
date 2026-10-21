/* トップ以外のページのヘッダーとフッター（DESIGN.md 7-1。トップの site.js の chrome() と同じ形）
   使い方：<body> のすぐあとに <script src="./hdr.js"></script> を置き、ページの初めで hslChrome('./results.html') のように呼ぶ。
   大会の切り替えは、いちばん新しい年度の大会を大会記録（results.html?comp=）へのリンクで出す。
   ページ側で #menu・#nav にクリックの処理を付けないこと（ここで付ける） */
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const GNAV=[['./','トップ'],['./results.html?tab=schedule','日程・結果'],['./results.html?tab=standings','順位表'],['./#calendar','カレンダー'],['./history.html','歴代成績'],['./news.html','お知らせ'],['./about.html','連盟について']];
  const SHORT={TOP:'北海道リーグ',SD:'札幌・道央ブロック',DN:'道南ブロック',DT:'道東・道北ブロック',BF:'ブロックリーグ決勝大会',SC:'全国社会人 北海道予選',CC:'全国クラブ 北海道予選',HC:'北海道選手権（天皇杯）'};
  const KIND={TOP:'リーグ',SD:'ブロック',DN:'ブロック',DT:'ブロック',BF:'決勝大会',SC:'カップ',CC:'カップ',HC:'カップ'};
  const KCOL={TOP:'var(--ink)',SD:'var(--logo-g)',DN:'var(--logo-g)',DT:'var(--logo-g)',BF:'var(--logo-b)',SC:'var(--logo-y)',CC:'var(--logo-y)',HC:'var(--logo-y)'};
  const ORDER=['TOP','SD','DN','DT','BF','SC','CC','HC'];
  window.hslChrome=function(cur){
    const here=cur||'';
    document.body.insertAdjacentHTML('afterbegin',
      '<header class="hd"><div class="wrap">'+
        '<nav class="cswitch" aria-label="大会の切り替え"><div class="bar" id="cswitch"></div></nav>'+
        '<div class="hrow"><a class="brand" href="./"><span class="lg"><img src="./img/hsl-logo.svg" alt="" width="34" height="38"></span><span><b>北海道サッカーリーグ</b><small>HOKKAIDO SOCCER LEAGUE</small></span></a>'+
        '<nav class="gnav" id="nav" aria-label="メニュー"><div class="bar">'+GNAV.map(([h,t])=>'<a href="'+h+'"'+(here===h?' aria-current="page"':'')+'>'+t+'</a>').join('')+'</div></nav>'+
        '<button class="menubtn" id="menu" aria-controls="nav" aria-expanded="false" aria-label="メニュー">☰</button></div>'+
      '</div><div class="tri"></div></header>');
    // フッターは、ページの中身がそろってから最後に置く（<body> のすぐあとで呼ばれても下に来るように）
    const addFooter=()=>document.body.insertAdjacentHTML('beforeend',
      '<footer class="ft"><div class="wrap in"><div><b>北海道サッカーリーグ</b><p>日程・結果・記録は、連盟の大会運営システムと公式記録から自動で反映しています。</p><p id="updated"></p></div>'+
      '<nav aria-label="サイトの中のリンク">'+GNAV.map(([h,t])=>'<a href="'+h+'">'+t+'</a>').join('')+'<a href="./referees.html">審判の担当</a></nav></div></footer>');
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(!document.querySelector('footer.ft'))addFooter()});else addFooter();
    const menu=document.getElementById('menu'),nav=document.getElementById('nav');
    menu.addEventListener('click',()=>{const o=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(o))});
    // 大会の切り替え：いちばん新しい年度（URL の comp があればその年度）の大会
    const comp=new URLSearchParams(location.search).get('comp')||'';
    fetch('../results/data/competitions.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{competitions:[]}).then(d=>{
      const cs=(d.competitions||[]).filter(c=>/^\d{4}-/.test(c.id));
      if(!cs.length)return;
      const y=(comp&&cs.some(c=>c.id===comp)?comp:cs[0].id).slice(0,4);
      const list=cs.filter(c=>c.id.startsWith(y+'-')).sort((a,b)=>ORDER.indexOf(a.id.split('-')[1])-ORDER.indexOf(b.id.split('-')[1]));
      document.getElementById('cswitch').innerHTML=list.map((c,i)=>{const k=c.id.split('-')[1];
        return (i&&KIND[k]!==KIND[list[i-1].id.split('-')[1]]?'<span class="sep" aria-hidden="true"></span>':'')+
          '<a href="./results.html?comp='+encodeURIComponent(c.id)+'"'+(c.id===comp?' aria-current="true"':'')+' style="--k:'+(KCOL[k]||'var(--ink)')+'"><i aria-hidden="true"></i>'+esc(SHORT[k]||c.name)+'</a>'}).join('');
      const on=document.querySelector('#cswitch [aria-current=true]');if(on)on.scrollIntoView({block:'nearest',inline:'center'});
    }).catch(()=>{});
  };
})();
