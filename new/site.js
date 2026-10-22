/* トップページ（index.html）の共通部分：ヘッダー・フッター・データの読み込み・エンブレム */
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QS=new URLSearchParams(location.search);


/* ヘッダー（大会の切り替え・ロゴ・メニュー）とフッター。DESIGN.md の 7-1
   大会の切り替えの中身は、データを読んだあと各ページが switchHTML() で入れる */
const GNAV=[['./','トップ'],['./results.html?tab=schedule','日程・結果'],['./results.html?tab=standings','順位表'],['./#calendar','カレンダー'],['./history.html','歴代成績'],['./news.html','お知らせ'],['./about.html','連盟について']];
function chrome(cur){
  document.body.insertAdjacentHTML('afterbegin',
    '<header class="hd"><div class="wrap">'+
      '<nav class="cswitch" aria-label="大会の切り替え"><div class="bar" id="cswitch" role="tablist"><span class="sk" style="width:240px;height:20px;margin:8px"></span></div></nav>'+
      '<div class="hrow"><a class="brand" href="./"><span class="lg"><img src="./img/hsl-logo.svg" alt="" width="34" height="38"></span><span><b>北海道サッカーリーグ</b><small>HOKKAIDO SOCCER LEAGUE</small></span></a>'+
      '<nav class="gnav" id="nav" aria-label="メニュー"><div class="bar">'+GNAV.map(([h,t])=>'<a href="'+h+'"'+(cur===h?' aria-current="page"':'')+'>'+t+'</a>').join('')+'</div></nav>'+
      '<button class="menubtn" id="menu" aria-controls="nav" aria-expanded="false" aria-label="メニュー">☰</button></div>'+
    '</div><div class="tri"></div></header>');
  document.body.insertAdjacentHTML('beforeend',
    '<footer class="ft"><div class="wrap in"><div><b>北海道サッカーリーグ</b><p>日程・結果・記録は、連盟の大会運営システムと公式記録から自動で反映しています。</p><p id="updated"></p></div>'+
    '<nav aria-label="サイトの中のリンク">'+GNAV.map(([h,t])=>'<a href="'+h+'">'+t+'</a>').join('')+'<a href="./referees.html">審判の担当</a></nav></div></footer>');
  $('menu').onclick=()=>{const o=$('nav').classList.toggle('open');$('menu').setAttribute('aria-expanded',String(o))};
}
/* 大会の印の色（DESIGN.md 2.） */
const KCOL={TOP:'var(--ink)',SD:'var(--logo-g)',DN:'var(--logo-g)',DT:'var(--logo-g)',BF:'var(--logo-b)',SC:'var(--logo-y)',CC:'var(--logo-y)',HC:'var(--logo-y)'};
/** 大会の切り替えのボタン（comps：loadAll() の大会、cur：選ばれている大会のコード） */
function switchHTML(comps,cur){
  return comps.map((c,i)=>(i&&KIND[c.code]!==KIND[comps[i-1].code]?'<span class="sep" aria-hidden="true"></span>':'')+
    '<button role="tab" data-c="'+c.code+'" aria-selected="'+(c.code===cur)+'" style="--k:'+(KCOL[c.code]||'var(--ink)')+'"><i aria-hidden="true"></i>'+esc(c.short)+'</button>').join('');
}

/* データ */
async function json(f){const r=await fetch('../results/data/'+f,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
let SEASON=null;
async function loadAll(){
  const all=(await json('competitions.json')).competitions||[];
  const dsAll=new Map(await Promise.all(all.map(c=>json(encodeURIComponent(c.id)+'.json').then(d=>[c.id,d]).catch(()=>[c.id,null]))));
  /* 表示する年度（season.js） */
  SEASON=await pickSeason(all,id=>((dsAll.get(id)||{}).matches||[]).length);
  const list=SEASON.comps,ds=list.map(c=>dsAll.get(c.id));
  /* チーム紹介（管理画面）のエンブレム・チーム写真：各大会の名簿（{id}-roster.json）の profile から */
  const rs=await Promise.all(list.map(c=>json(encodeURIComponent(c.id)+'-roster.json').catch(()=>null)));
  for(const r of rs)for(const t of (r&&r.teams)||[])if(t.profile&&t.team)for(const k of [t.team.id,t.team.name,t.team.univ])if(k&&!PROF.has(k))PROF.set(k,t.profile);
  return list.map((c,i)=>({...c,code:c.id.split('-').pop(),short:compShort(c),data:ds[i]})).filter(c=>c.data);
}
const SHORT={TOP:'北海道リーグ',SD:'札幌・道央ブロック',DN:'道南ブロック',DT:'道東・道北ブロック',BF:'ブロックリーグ決勝大会',SC:'全国社会人 北海道予選',CC:'全国クラブ 北海道予選',HC:'北海道選手権（天皇杯）'};
const KIND={TOP:'リーグ',SD:'ブロック',DN:'ブロック',DT:'ブロック',BF:'決勝大会',SC:'カップ',CC:'カップ',HC:'カップ'};
function compShort(c){return SHORT[c.id.split('-').pop()]||c.name}
const isFinal=m=>/^決勝$|代表決定/.test(m.round||'');
const done=m=>m.score&&m.score.home!=null;
/* 速報（live.js）：確定前の試合だけ */
const liveOf=m=>!done(m)&&window.HSL_LIVE?HSL_LIVE.of(m.matchId):null;
const order=ms=>[...ms].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.kickoff||'').localeCompare(String(b.kickoff||'')));
const WD=['日','月','火','水','木','金','土'];
function md(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?(+m[2])+'/'+(+m[3]):'未定'}
function wd(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?WD[new Date(+m[1],+m[2]-1,+m[3]).getDay()]:''}
function scoreText(m){if(!done(m))return 'vs';const s=m.score;return s.home+'-'+s.away+(s.pk?' (PK'+s.pk.home+'-'+s.pk.away+')':'')}
const teamUrl=t=>'./team.html?team='+encodeURIComponent(t.id);
const matchUrl=(c,m)=>'./results.html?comp='+encodeURIComponent(c)+(done(m)||liveOf(m)?'&match='+encodeURIComponent(m.matchId):'');
const compUrl=(c,tab)=>'./results.html?comp='+encodeURIComponent(c)+(tab?'&tab='+tab:'');
/* 大会の勝者：リーグは1位、トーナメントは決勝（代表決定戦）の勝者 */
function winners(c){
  const d=c.data;
  if(d.groups&&d.groups.length&&d.groups.some(g=>g.table&&g.table.length)){
    const g=d.groups.find(g=>/上位/.test(g.group||''))||d.groups[0];
    const all=d.matches.length&&d.matches.every(done);
    return {kind:'table',list:g.table.slice(0,c.code==='BF'?2:1).map(r=>r.team),final:all,label:all?(c.code==='BF'?'昇格':'優勝'):'首位'};
  }
  const fin=d.matches.filter(m=>isFinal(m)&&done(m));
  return {kind:'cup',list:fin.map(m=>m.winner===m.away.id?m.away:m.home),final:fin.length>0,label:c.code==='HC'?'優勝':'北海道代表'};
}

/* 画像の置き場所
 *  ・管理画面（チーム紹介の「エンブレム」「チーム写真」、トップ写真）で入れたものを先に使う
 *  ・なければ、GitHub に置いたファイル：new/emblems/（index.json に {"クラブの正式名":"ファイル名"}）
 *    new/photos/（index.json に {"top":[{"file","caption","credit","link"}],"teams":{"クラブの正式名":"ファイル名"}}）
 */
const PROF=new Map();
let EMB={},PH={};
const embReady=Promise.all([
  fetch('./emblems/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{EMB=j||{}}).catch(()=>{}),
  fetch('./photos/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{PH=j||{}}).catch(()=>{})
]);
const FILE_RE=/^[^\/\\?#]+\.(png|jpe?g|webp|svg|gif)$/i;
/* 画像のURL：https のURL・Googleドライブの共有リンク・dir に置いたファイル名 */
function imgUrl(v,dir,w){
  v=String(v||'').trim();if(!v)return '';
  const d=v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
  if(d)return 'https://drive.google.com/thumbnail?id='+d[1]+'&sz=w'+(w||400);
  if(/^https:\/\//i.test(v))return v;
  if(FILE_RE.test(v))return './'+dir+'/'+encodeURIComponent(v);
  return '';
}
const profOf=t=>PROF.get(t.id)||PROF.get(t.name)||PROF.get(t.univ)||null;
function emblemOf(t){const p=profOf(t);return imgUrl(p&&p.emblem,'emblems')||imgUrl(EMB[t.name]||EMB[t.univ]||EMB[t.short]||EMB[t.id],'emblems')}
function teamPhotoOf(t,w){const p=profOf(t),m=PH.teams||{};return imgUrl(p&&p.teamPhoto,'photos',w)||imgUrl(m[t.name]||m[t.univ]||m[t.id],'photos',w)}
/* トップの写真：管理画面のトップ写真（news.json の hero）＋ new/photos/index.json の top */
async function topPhotos(){
  let hero=[];try{hero=(await json('news.json')).hero||[]}catch(e){}
  const a=hero.map(h=>({src:imgUrl(h.photo,'photos',1600),caption:h.caption||'',credit:h.credit||'',link:/^https:\/\//.test(h.url||'')?h.url:''}));
  const b=(PH.top||[]).map(h=>({src:imgUrl(h.file||h.photo,'photos',1600),caption:h.caption||'',credit:h.credit||'',link:/^https:\/\//.test(h.link||'')?h.link:''}));
  return a.concat(b).filter(x=>x.src);
}
const PALETTE=['var(--draw)'];  // チームの色が入っていないときの台の色（DESIGN.md の色だけ）
function crest(t,size){
  const n=t.short||t.name||'';let h=0;for(const ch of t.id||n)h=(h*31+ch.charCodeAt(0))>>>0;
  const u=emblemOf(t);
  const s=n.replace(/^(北海道)/,'').replace(/(クラブ)$/,'')||n,ch=[...s].slice(0,2).join('');
  const p=profOf(t),c=/^#[0-9a-f]{3,8}$/i.test((p&&p.color)||'')?p.color:PALETTE[h%PALETTE.length];
  if(u)return '<span class="crest img '+(size||'')+'" style="--c:'+c+'" data-ch="'+esc(ch)+'"><img src="'+esc(u)+'" alt="" loading="lazy" onerror="crestFail(this)"></span>';
  return '<span class="crest '+(size||'')+'" style="--c:'+c+'">'+esc(ch)+'</span>';
}
/* 画像が読めないときは文字のエンブレムにもどす */
function crestFail(img){const s=img.parentNode;s.classList.remove('img');s.textContent=s.dataset.ch||''}
