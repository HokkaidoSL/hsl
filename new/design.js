/* デザイン案の切り替え（試作。2026-10）
 * URL に ?design=a（b・c）を付けると、theme.css の代わりに design/a.css を読む。?design=0 で今のデザインに戻る
 * 選んだ案は、そのタブを閉じるまで、ほかのページに移っても続く（sessionStorage）
 * デザインが決まったら、このファイルと design/ を消し、決まった案を theme.css にする
 */
(function(){
  var KEY='hsl-design',NAMES={'':'今のデザイン',a:'A 雪原',b:'B ピッチ',c:'C ヘキサ'};
  var d='',shown=false;
  try{
    var q=new URLSearchParams(location.search).get('design');
    if(q!==null)sessionStorage.setItem(KEY,/^[abc]$/.test(q)?q:'');
    var s=sessionStorage.getItem(KEY);
    if(s!==null){shown=true;d=/^[abc]$/.test(s)?s:''}
  }catch(e){}
  if(d){
    var l=document.querySelector('link[href="./theme.css"]');
    if(l)l.href='./design/'+d+'.css';
    document.documentElement.setAttribute('data-design',d);
  }
  if(!shown)return;
  // 画面の左下に、案を切り替えるボタンを出す
  document.addEventListener('DOMContentLoaded',function(){
    var box=document.createElement('div');
    box.setAttribute('style','position:fixed;left:10px;bottom:10px;z-index:99;display:flex;gap:4px;align-items:center;background:#fff;color:#222;border:1px solid #ccc;border-radius:8px;padding:5px 6px;font:700 11px/1 "Noto Sans JP",sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.25)');
    var lab=document.createElement('span');lab.textContent='デザイン案';lab.style.padding='0 4px';box.appendChild(lab);
    Object.keys(NAMES).forEach(function(k){
      var a=document.createElement('a');
      var u=new URL(location.href);u.searchParams.set('design',k||'0');
      a.href=u.toString();a.textContent=k?k.toUpperCase():'今';a.title=NAMES[k];
      a.setAttribute('style','display:inline-block;min-width:26px;text-align:center;padding:6px 7px;border-radius:5px;'+(k===d?'background:#222;color:#fff':'background:#eee;color:#222'));
      box.appendChild(a);
    });
    document.body.appendChild(box);
  });
})();
