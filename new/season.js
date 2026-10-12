/* 年度（シーズン）の切り替え：トップ・大会記録・チームページで使う
 *  ・大会の一覧（competitions.json）には、いくつもの年度の大会が並ぶ（2026年度の記録＋2027年度の大会 など）
 *  ・表示する年度：URL の ?y=、なければ ?comp= の大会の年度、なければ「試合（日程）が入っている、いちばん新しい年度」
 *    → 新しい年度の大会を大会マスターに入れただけ（日程がまだ）なら、前の年度のまま表示する
 *  ・年度が2つ以上あるときだけ、切り替えの選択肢を出す
 */
const yearOf=c=>String(c&&c.year||String(c&&c.id||'').slice(0,4));
/** comps：大会の一覧。count(id)：その大会の試合の数を返す（Promise）。戻り値：{year, years, comps} */
async function pickSeason(comps,count){
  const years=[...new Set(comps.map(yearOf))].filter(y=>/^\d{4}$/.test(y)).sort().reverse();
  const qs=new URLSearchParams(location.search);
  let y=qs.get('y');
  if(!years.includes(y)){const c=comps.find(c=>c.id===qs.get('comp'));y=c?yearOf(c):''}
  if(!years.includes(y)){
    y=years[years.length-1]||'';
    for(const yy of years){
      const n=await Promise.all(comps.filter(c=>yearOf(c)===yy).map(c=>Promise.resolve(count(c.id)).catch(()=>0)));
      if(n.some(x=>x>0)){y=yy;break}
    }
  }
  return {year:y,years,comps:comps.filter(c=>yearOf(c)===y)};
}
/** 年度の選択肢（年度が1つのときは空）。選ぶと ?y=年度 で開き直す */
function seasonSelect(s,cls){
  if(!s||s.years.length<2)return '';
  return '<label class="'+(cls||'season')+'"><span>年度</span><select onchange="location.href=location.pathname+\'?y=\'+this.value">'+
    s.years.map(y=>'<option value="'+y+'"'+(y===s.year?' selected':'')+'>'+y+'年度</option>').join('')+'</select></label>';
}
