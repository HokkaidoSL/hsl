/* レイアウト案（試作）の共通部分：配色の切り替え・ヘッダー・フッター・データの読み込み・エンブレム */
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const QS=new URLSearchParams(location.search);

/* 配色：?p=a（雪原）・?p=c（ヘキサ）。選んだものはタブを閉じるまで続く */
let PAL='a';
try{const q=QS.get('p');if(q==='a'||q==='c')sessionStorage.setItem('hsl-pal',q);PAL=sessionStorage.getItem('hsl-pal')||'a'}catch(e){}
document.documentElement.setAttribute('data-p',PAL);

const PAGES=[['top.html','トップ'],['board.html','大会ボード']];
function chrome(){
  const here=location.pathname.split('/').pop();
  document.body.insertAdjacentHTML('afterbegin',
    '<header class="hd"><div class="wrap in"><a class="brand" href="./top.html"><span class="lg"><img src="../img/hsl-logo.svg" alt="" width="34" height="38"></span><span><b>北海道サッカーリーグ</b><small>Hokkaido Soccer League</small></span></a>'+
    '<nav><a href="./top.html#calendar">カレンダー</a><a href="./board.html">大会記録</a><a href="../news.html">お知らせ</a><a href="../about.html">連盟について</a></nav></div><div class="tri"></div></header>');
  document.body.insertAdjacentHTML('beforeend',
    '<footer class="ft"><div class="tri"></div><div class="wrap in"><div><b>北海道サッカーリーグ</b><p>新しいトップの試作です。データは公式記録から反映しています。</p></div><nav><a href="./top.html">トップ</a><a href="./board.html">大会記録</a><a href="../">今のトップ</a></nav></div></footer>'+
    '<div class="proto"><span>試作</span>'+PAGES.map(([f,t])=>'<a class="'+(f===here?'on':'')+'" href="./'+f+'">'+t+'</a>').join('')+
    '<i></i><span>色</span><a class="'+(PAL==='a'?'on':'')+'" href="?p=a">A</a><a class="'+(PAL==='c'?'on':'')+'" href="?p=c">C</a></div>');
}

/* データ */
async function json(f){const r=await fetch('../../results/data/'+f,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function loadAll(){
  const list=(await json('competitions.json')).competitions||[];
  const ds=await Promise.all(list.map(c=>json(encodeURIComponent(c.id)+'.json').catch(()=>null)));
  return list.map((c,i)=>({...c,code:c.id.split('-').pop(),short:compShort(c),data:ds[i]})).filter(c=>c.data);
}
const SHORT={TOP:'北海道リーグ',SD:'札幌・道央ブロック',DN:'道南ブロック',DT:'道東・道北ブロック',BF:'ブロックリーグ決勝大会',SC:'全国社会人 北海道予選',CC:'全国クラブ 北海道予選',HC:'北海道選手権（天皇杯）'};
const KIND={TOP:'リーグ',SD:'ブロック',DN:'ブロック',DT:'ブロック',BF:'決勝大会',SC:'カップ',CC:'カップ',HC:'カップ'};
function compShort(c){return SHORT[c.id.split('-').pop()]||c.name}
const isFinal=m=>/^決勝$|代表決定/.test(m.round||'');
const done=m=>m.score&&m.score.home!=null;
const order=ms=>[...ms].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.kickoff||'').localeCompare(String(b.kickoff||'')));
const WD=['日','月','火','水','木','金','土'];
function md(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?(+m[2])+'/'+(+m[3]):'未定'}
function wd(s){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(s||'');return m?WD[new Date(+m[1],+m[2]-1,+m[3]).getDay()]:''}
function scoreText(m){if(!done(m))return 'vs';const s=m.score;return s.home+'-'+s.away+(s.pk?' (PK'+s.pk.home+'-'+s.pk.away+')':'')}
const teamUrl=t=>'../team.html?team='+encodeURIComponent(t.id);
const matchUrl=(c,m)=>'../results.html?comp='+encodeURIComponent(c)+(done(m)?'&match='+encodeURIComponent(m.matchId):'');
const compUrl=(c,tab)=>'../results.html?comp='+encodeURIComponent(c)+(tab?'&tab='+tab:'');
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

/* エンブレム（new/emblems/index.json があれば画像） */
let EMB={};
const embReady=fetch('../emblems/index.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(j=>{EMB=j||{}}).catch(()=>{});
const PALETTE=['#145ec9','#0f7a6b','#7b3fb5','#c0392b','#1d6fa5','#b35c00','#2e7d32','#ad1457','#37474f','#5d4dbf'];
function crest(t,size){
  const n=t.short||t.name||'';let h=0;for(const ch of t.id||n)h=(h*31+ch.charCodeAt(0))>>>0;
  const f=EMB[t.name]||EMB[t.univ]||EMB[t.short];
  if(f&&/^[^\/\\?#]+\.(png|jpe?g|webp|svg|gif)$/i.test(f))return '<span class="crest img '+(size||'')+'"><img src="../emblems/'+encodeURIComponent(f)+'" alt=""></span>';
  const s=n.replace(/^(北海道)/,'').replace(/(クラブ)$/,'')||n;
  return '<span class="crest '+(size||'')+'" style="--c:'+PALETTE[h%PALETTE.length]+'">'+esc([...s].slice(0,2).join(''))+'</span>';
}
