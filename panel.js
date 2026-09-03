/* لوحة تحكّم المدونة */
(function () {
var OWNER="marwanbalushi", REPO="marwanbalushi.github.io", BRANCH="main";
var SITE=location.origin+location.pathname.replace(/[^\/]*$/,"");
var $=function(i){return document.getElementById(i)};
var TOKEN="",UPKEY="",WORKER="",CFG=null,DATA=[],SHA={},cur=null,MED=[],MED0=[],LIB=null;
var shown=0,PAGE=20,picked={};
var AR=function(n){return String(n).replace(/\d/g,function(d){return "٠١٢٣٤٥٦٧٨٩"[d]})};
var MON=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
var FONTS=["Amiri","Scheherazade New","Markazi Text","Noto Naskh Arabic","Lateef",
  "Noto Kufi Arabic","Reem Kufi","Aref Ruqaa","Cairo","Tajawal","Almarai",
  "IBM Plex Sans Arabic","Readex Pro","Alexandria"];
var COLORS=[["paper","الخلفية"],["paper2","خلفية ثانوية"],["ink","الحبر"],
  ["accent","اللون الأساسي"],["gold","اللون الثانوي"],["muted","النصّ الخافت"],["rule","الخطوط الفاصلة"]];
var DEFAULTS=null;

function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")}
function say(el,t,k){el.textContent=t;el.className="msg "+(k||"ok")}
function stt(t){$("status").textContent=t}
function b64e(str){var b=new TextEncoder().encode(str),s="";
  for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s)}
function ab2b64(x){var b=new Uint8Array(x),s="";for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s)}
function b642ab(s){var n=atob(s),b=new Uint8Array(n.length);for(var i=0;i<n.length;i++)b[i]=n.charCodeAt(i);return b}

/* ---------- التشفير ---------- */
var ITER=600000;
function derive(p,salt){
  return crypto.subtle.importKey("raw",new TextEncoder().encode(p),"PBKDF2",false,["deriveKey"])
  .then(function(k){return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:ITER,hash:"SHA-256"},
    k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])})}
function encTok(v,p){var s=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  return derive(p,s).then(function(k){return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},k,new TextEncoder().encode(v))})
  .then(function(c){return{v:1,it:ITER,salt:ab2b64(s),iv:ab2b64(iv),ct:ab2b64(c)}})}
function decTok(o,p){return derive(p,b642ab(o.salt)).then(function(k){
  return crypto.subtle.decrypt({name:"AES-GCM",iv:b642ab(o.iv)},k,b642ab(o.ct))})
  .then(function(x){return new TextDecoder().decode(x)})}

function api(path,opt){opt=opt||{};opt.headers=Object.assign({"Authorization":"Bearer "+TOKEN,
  "Accept":"application/vnd.github+json"},opt.headers||{});
  return fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+path,opt)}

/* ---------- الإعداد ---------- */
$("toSetup").onclick=function(){$("login").className="wrap hide";$("setup").className="wrap"};
$("toLogin").onclick=function(){$("setup").className="wrap hide";$("login").className="wrap"};
$("mkkey").onclick=function(){
  var tok=$("stok").value.trim(),up=$("sup").value.trim(),wk=$("swrk").value.trim().replace(/\/+$/,"");
  var p1=$("sp1").value,p2=$("sp2").value;
  if(!tok) return say($("smsg"),"الصق مفتاح GitHub","err");
  if(wk && !/^https:\/\//.test(wk)) return say($("smsg"),"رابط الوسيط يجب أن يبدأ بـ https://","err");
  if(p1.length<16) return say($("smsg"),"الجملة قصيرة. اجعلها ١٦ حرفاً فأكثر.","err");
  if(p1!==p2) return say($("smsg"),"الجملتان غير متطابقتين","err");
  say($("smsg"),"جارٍ التشفير…","wait");
  encTok(JSON.stringify({gh:tok,up:up,wk:wk}),p1).then(function(o){
    var a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:"application/json"}));
    a.download="mift.json";a.click();
    say($("smsg"),"نزل mift.json — ارفعه إلى المستودع ثم افتح بجملتك.");
  }).catch(function(e){say($("smsg"),"تعذّر التشفير: "+e.message,"err")})};

/* ---------- الفتح ---------- */
$("pass").addEventListener("keydown",function(e){if(e.key==="Enter")$("unlock").click()});
$("unlock").onclick=function(){
  var p=$("pass").value; if(!p) return say($("lmsg"),"اكتب جملتك","err");
  say($("lmsg"),"جارٍ الفتح… قد يستغرق ثوانٍ","wait");
  fetch(SITE+"mift.json?t="+Date.now()).then(function(r){
    if(!r.ok) throw new Error("لم أجد ملف المفتاح. أنشئه من «إعداد جملة سرّ جديدة».");return r.json()})
  .then(function(o){return decTok(o,p)})
  .then(function(raw){try{var o=JSON.parse(raw);TOKEN=o.gh;UPKEY=o.up||"";WORKER=o.wk||""}catch(x){TOKEN=raw}return boot()})
  .catch(function(e){say($("lmsg"),(e.name==="OperationError")?"الجملة غير صحيحة":e.message,"err")})};
$("logout").onclick=function(){try{localStorage.removeItem("ghunlocked")}catch(e){}location.href="tahrir.html"};

function boot(){
  return api("/git/trees/"+BRANCH).then(function(r){
    if(!r.ok) throw new Error("المفتاح لا يملك صلاحية على المستودع");return r.json()})
  .then(function(j){
    j.tree.forEach(function(f){if(f.path==="data.json"||f.path==="config.json")SHA[f.path]=f.sha});
    if(!SHA["data.json"]) throw new Error("لم أجد data.json");
    try{localStorage.setItem("ghunlocked","1")}catch(e){}
    return Promise.all([
      fetch(SITE+"config.json?t="+Date.now()).then(function(r){return r.json()}),
      fetch(SITE+"data.json?t="+Date.now()).then(function(r){return r.json()})]);
  }).then(function(res){
    CFG=res[0];DATA=res[1];DEFAULTS=JSON.parse(JSON.stringify(CFG));
    $("login").className="wrap hide";$("setup").className="wrap hide";
    $("app").className="";$("foot").className="foot";
    stt("مفتوح · "+AR(DATA.length)+" مدخلاً");
    buildIdentity();buildLook();fillDoorSelects();render();
    var h=location.hash.replace("#/","").replace("#","").trim();
    if(h==="new") openF(null);
    else if(h){var e=DATA.filter(function(x){return x.id===h})[0];if(e)openF(e)}
  })}

/* ---------- التبويبات ---------- */
document.querySelectorAll(".tabs button").forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll(".tabs button").forEach(function(x){x.classList.toggle("on",x===b)});
    ["entries","identity","look"].forEach(function(t){
      $("tab-"+t).className="wrap"+(t===b.dataset.t?"":" hide")});
    $("savecfg").className = b.dataset.t==="entries" ? "p hide":"p";
    if(b.dataset.t==="look") drawPreview();
  }});

/* ---------- الأبواب في القوائم ---------- */
function doorNames(){return CFG.doors.map(function(d){return d.pred?d.subj+" "+d.pred:d.subj})}
function fillDoorSelects(){
  var names=doorNames().concat(["غير مصنّف"]);
  [["fdoor","كل الأبواب"],["bulkdoor","انقل إلى باب…"]].forEach(function(p){
    var s=$(p[0]);s.innerHTML='<option value="">'+p[1]+"</option>"+
      names.map(function(n){return "<option>"+esc(n)+"</option>"}).join("")});
  $("fdoorsel").innerHTML=names.map(function(n){return "<option>"+esc(n)+"</option>"}).join("");
}
function dkOf(name){var d=CFG.doors.filter(function(x){return (x.pred?x.subj+" "+x.pred:x.subj)===name})[0];
  return d?d.key:""}

/* ---------- قائمة المداخل ---------- */
function filtered(){
  var q=$("q").value.trim(),d=$("fdoor").value,s=$("fstate").value;
  return DATA.filter(function(e){
    return (!q||e.t.indexOf(q)>-1)&&(!d||e.door===d)&&
      (!s||(s==="draft"?!!e.draft:!e.draft))})}
function render(more){
  if(!more)shown=0;
  var L=filtered(),box=$("list");
  if(shown===0)box.innerHTML="";
  $("cnt").textContent=AR(L.length);
  var n=L.slice(shown,shown+PAGE);
  box.insertAdjacentHTML("beforeend",n.map(function(e){
    return '<div class="card'+(picked[e.id]?" pick":"")+'" data-id="'+e.id+'">'+
      '<div class="chk">✓</div><div class="bd"><p class="m">'+e.d+" · <b>"+esc(e.door)+"</b>"+
      '<span class="pill">'+(e.f==="waqfah"?"طويل":"قصير")+"</span>"+
      (e.m&&e.m.length?'<span class="pill">'+AR(e.m.length)+" وسائط</span>":"")+
      (e.draft?'<span class="pill d">مسوّدة</span>':"")+
      '</p><p class="t">'+esc(e.t)+"</p></div></div>"}).join(""));
  shown+=n.length;
  $("more").style.display=shown<L.length?"block":"none";
  $("more").textContent="المزيد ("+AR(L.length-shown)+")"}
$("more").onclick=function(){render(true)};
$("q").oninput=function(){render()};
$("fdoor").onchange=function(){render()};
$("fstate").onchange=function(){render()};
$("list").onclick=function(ev){
  var c=ev.target.closest(".card");if(!c)return;
  var e=DATA.filter(function(x){return x.id===c.dataset.id})[0];
  if(ev.target.closest(".chk")){
    if(picked[e.id])delete picked[e.id];else picked[e.id]=1;
    c.classList.toggle("pick");updBulk();return}
  openF(e)};
function updBulk(){
  var n=Object.keys(picked).length;
  $("npick").textContent=AR(n);
  $("bulkbar").className=n?"row":"row hide"}
$("bulkclear").onclick=function(){picked={};updBulk();render()};
$("bulkdoor").onchange=function(){
  var name=this.value;if(!name)return;
  DATA.forEach(function(e){if(picked[e.id]){e.door=name;e.dk=dkOf(name)}});
  this.value="";commitData("نقل مداخل إلى "+name)};
$("bulkdraft").onclick=function(){
  DATA.forEach(function(e){if(picked[e.id])e.draft=true});commitData("تحويل إلى مسوّدات")};
$("bulkpub").onclick=function(){
  DATA.forEach(function(e){if(picked[e.id])delete e.draft});commitData("نشر مداخل")};

/* ---------- الوسائط ---------- */
function drawMed(){
  var g=$("mgrid");g.innerHTML="";
  $("mempty").className=MED.length?"hide":"";
  MED.forEach(function(m,i){
    var vis=m.v?'<video muted playsinline preload="metadata" src="'+CFG.media.base+"/"+(m.vf||m.f)+'#t=0.5"></video>'
      :'<img loading="lazy" src="'+CFG.media.base+"/"+m.f+'" alt="">';
    var name=m.v?(m.vf||m.f):m.f;
    g.insertAdjacentHTML("beforeend",'<div class="mit">'+vis+
      (m.v?'<span class="vtag">مقطع</span>':"")+
      '<button class="x" data-i="'+i+'">&times;</button><div class="lab">'+esc(name)+"</div></div>")});
  var lost=MED0.length&&MED.length<MED0.length;
  $("mwarn").className=lost&&!MED.length?"warn on":"warn";
  $("mrestore").style.display=lost?"inline":"none";
  drawFPrev()}
$("mgrid").onclick=function(e){var b=e.target.closest(".x");if(!b)return;
  MED.splice(+b.dataset.i,1);drawMed()};
$("mrestore").onclick=function(){MED=MED0.map(function(m){return Object.assign({},m)});drawMed()};
$("maddBtn").onclick=function(){$("maddBox").className=$("maddBox").className?"":"hide"};
$("maddOk").onclick=function(){var f=$("madd").value.trim();if(!f)return;
  var o={f:f,u:"",v:/\.(mp4|mov|webm)$/i.test(f)};if(o.v)o.vf=f;
  MED.push(o);$("madd").value="";drawMed()};

$("upBtn").onclick=function(){$("upfile").click()};
$("upavBtn").onclick=function(){$("upav").click()};
function upOne(file,onProg){
  return new Promise(function(res,rej){
    if(!WORKER||!UPKEY)return rej(new Error("الوسيط غير مُعدّ"));
    var x=new XMLHttpRequest();x.open("POST",WORKER,true);
    x.setRequestHeader("Content-Type",file.type||"application/octet-stream");
    x.setRequestHeader("X-Auth",UPKEY);
    x.setRequestHeader("X-Filename",encodeURIComponent(file.name));
    x.upload.onprogress=function(e){if(e.lengthComputable&&onProg)onProg(e.loaded/e.total)};
    x.onload=function(){var j;try{j=JSON.parse(x.responseText)}catch(e){return rej(new Error("ردّ غير مفهوم"))}
      if(x.status===200&&j.ok)res(j.file);else rej(new Error(j.error||("خطأ "+x.status)))};
    x.onerror=function(){rej(new Error("تعذّر الاتصال بالوسيط"))};
    x.send(file)})}
$("upfile").onchange=function(){
  var files=[].slice.call(this.files);if(!files.length)return;
  var i=0,ok=0;$("upbar").className="";
  (function next(){
    if(i>=files.length){$("upmsg").textContent="رُفع "+AR(ok)+" من "+AR(files.length);
      $("upbar").className="hide";$("upfile").value="";drawMed();return}
    var f=files[i++];$("upmsg").textContent="جارٍ رفع "+f.name+"…";$("upfill").style.width="0";
    upOne(f,function(p){$("upfill").style.width=Math.round(p*100)+"%"}).then(function(name){
      var o={f:name,u:"",v:/^video\//.test(f.type)};if(o.v)o.vf=name;
      MED.push(o);ok++;drawMed();next()})
    .catch(function(e){$("upmsg").textContent="فشل «"+f.name+"»: "+e.message;
      $("upbar").className="hide";$("upfile").value=""})})()};
$("upav").onchange=function(){
  var f=this.files[0];if(!f)return;$("upavmsg").textContent="جارٍ الرفع…";
  upOne(f).then(function(name){$("i_portrait").value=CFG.media.base+"/"+name;
    $("upavmsg").textContent="تمّ. احفظ الإعدادات.";drawPreview()})
  .catch(function(e){$("upavmsg").textContent="فشل: "+e.message})};

$("libBtn").onclick=function(){
  var L=$("lib");
  if(L.className===""){L.className="hide";return}
  L.className="";
  if(LIB){drawLib();return}
  $("libgrid").innerHTML='<p style="color:var(--muted);font-size:14px">جارٍ الجمع…</p>';
  var seen={},out=[];
  DATA.forEach(function(e){(e.m||[]).forEach(function(m){
    var k=m.vf||m.f;if(!seen[k]){seen[k]=1;out.push(m)}})});
  LIB=out.slice(0,300);drawLib()};
function drawLib(){
  $("libgrid").innerHTML=LIB.map(function(m,i){
    var vis=m.v?'<video muted preload="metadata" src="'+CFG.media.base+"/"+(m.vf||m.f)+'#t=0.5"></video>'
      :'<img loading="lazy" src="'+CFG.media.base+"/"+m.f+'" alt="">';
    return '<div class="mit" data-li="'+i+'" style="cursor:pointer">'+vis+
      (m.v?'<span class="vtag">مقطع</span>':"")+"</div>"}).join("")}
$("libgrid").onclick=function(e){var c=e.target.closest("[data-li]");if(!c)return;
  MED.push(Object.assign({},LIB[+c.dataset.li]));drawMed()};

/* ---------- نموذج المدخل ---------- */
function openF(e){
  cur=e;
  $("upwrap").className=(WORKER&&UPKEY)?"":"hide";
  $("upmsg").textContent="";$("lib").className="hide";
  $("ftitle").textContent=e?"تحرير مدخل":"مدخل جديد";
  $("ftext").value=e?e.t:"";
  $("fdoorsel").value=e?e.door:"غير مصنّف";
  $("fform").value=e?e.f:"shathrah";
  $("fdate").value=e?e.iso:new Date().toISOString().slice(0,10);
  $("fdraft").checked=e?!!e.draft:false;
  MED0=e&&e.m?e.m.map(function(m){return Object.assign({},m)}):[];
  MED=MED0.map(function(m){return Object.assign({},m)});
  $("del").style.display=e?"":"none";
  $("fmsg").className="msg";
  $("app").className="hide";$("form").className="wrap";
  drawMed();window.scrollTo(0,0)}
$("new").onclick=function(){openF(null)};
$("cancel").onclick=function(){location.hash="";$("form").className="wrap hide";
  $("app").className="";render()};
["ftext","fform","fdoorsel","fdate","fdraft"].forEach(function(id){
  $(id).addEventListener("input",drawFPrev);$(id).addEventListener("change",drawFPrev)});

function pvVars(){
  var L=CFG.theme.light,t=CFG.type;
  return "--pv-paper:"+L.paper+";--pv-ink:"+L.ink+";--pv-accent:"+L.accent+
    ";--pv-gold:"+L.gold+";--pv-muted:"+L.muted+";--pv-rule:"+L.rule+
    ';--pv-text:"'+t.text+'";--pv-display:"'+t.display+'";--pv-size:'+t.sizeDesktop+
    "px;--pv-lh:"+t.lineHeight}
function drawFPrev(){
  var txt=$("ftext").value,d=$("fdate").value.split("-");
  var date=d.length===3?AR(parseInt(d[2],10))+" "+MON[parseInt(d[1],10)-1]+" "+AR(d[0]):"";
  var med=MED.map(function(m){
    return m.v?'<video controls preload="metadata" src="'+CFG.media.base+"/"+(m.vf||m.f)+'#t=0.5"></video>'
      :'<img src="'+CFG.media.base+"/"+m.f+'" alt="">'}).join("");
  var rt=CFG.layout.showReadingTime&&txt.length>400
    ? " · "+AR(Math.max(1,Math.round(txt.trim().split(/\s+/).length/180)))+" دقيقة قراءة":"";
  $("fprev").setAttribute("style",pvVars());
  $("fprev").innerHTML='<p class="pm">'+date+" · <b>"+esc($("fdoorsel").value)+"</b>"+rt+
    ($("fdraft").checked?" · مسوّدة":"")+"</p>"+med+
    '<p class="pt">'+esc(txt||"…")+"</p>"+
    (CFG.layout.showEndMark!==false?'<div class="pend"><i></i><span></span><i></i></div>':"")}

function collect(){
  var txt=$("ftext").value.trim();if(!txt)throw new Error("النصّ فارغ");
  var iso=$("fdate").value;if(!iso)throw new Error("اختر التاريخ");
  var p=iso.split("-"),door=$("fdoorsel").value;
  var o={t:txt,iso:iso,d:AR(parseInt(p[2],10))+" "+MON[parseInt(p[1],10)-1]+" "+AR(p[0]),
    door:door,dk:dkOf(door),f:$("fform").value,m:MED,n:1};
  if($("fdraft").checked)o.draft=true;
  return o}
$("save").onclick=function(){
  if(MED0.length&&!MED.length&&!confirm("هذا المدخل فيه "+AR(MED0.length)+" من الوسائط وستحفظه بلا شيء منها. أتريد المتابعة؟"))return;
  var o;try{o=collect()}catch(e){return say($("fmsg"),e.message,"err")}
  if(cur){Object.keys(o).forEach(function(k){cur[k]=o[k]});if(!o.draft)delete cur.draft}
  else{o.id="n"+Date.now();DATA.push(o)}
  DATA.sort(function(a,b){return a.iso<b.iso?1:a.iso>b.iso?-1:0});
  commitData("تحديث مدخل",$("fmsg"))};
$("del").onclick=function(){
  if(!cur||!confirm("حذف هذا المدخل نهائياً؟"))return;
  DATA=DATA.filter(function(x){return x!==cur});commitData("حذف مدخل",$("fmsg"))};

/* ---------- الهوية ---------- */
function buildIdentity(){
  var s=CFG.site;
  $("i_name").value=s.name;$("i_tagline").value=s.tagline;$("i_about").value=s.about;
  $("i_loc").value=s.location||"";$("i_clabel").value=s.contactLabel||"";$("i_curl").value=s.contactUrl||"";
  $("i_portrait").value=s.portrait||"";$("i_avsize").value=s.avatarSize||66;
  $("i_avcap").value=s.avatarCaption||"عن الكاتب";$("i_showav").checked=s.showAvatar!==false;
  $("f_all").value=CFG.forms.all;$("f_waqfah").value=CFG.forms.waqfah;$("f_shathrah").value=CFG.forms.shathrah;
  drawDoors()}
function drawDoors(){
  $("doors").innerHTML=CFG.doors.map(function(d,i){
    return '<div class="row" data-di="'+i+'" style="margin-bottom:8px">'+
      '<div><input class="d-subj" value="'+esc(d.subj)+'" placeholder="المبتدأ"></div>'+
      '<div><input class="d-pred" value="'+esc(d.pred||"")+'" placeholder="الخبر (اختياري)"></div>'+
      '<button class="sm d-up">▲</button><button class="sm d-dn">▼</button>'+
      '<button class="sm dl d-rm">حذف</button></div>'}).join("")}
$("doors").addEventListener("click",function(e){
  var row=e.target.closest("[data-di]");if(!row)return;var i=+row.dataset.di;
  readDoors();
  if(e.target.classList.contains("d-rm")){if(CFG.doors.length<2)return;CFG.doors.splice(i,1)}
  else if(e.target.classList.contains("d-up")&&i>0){var a=CFG.doors.splice(i,1)[0];CFG.doors.splice(i-1,0,a)}
  else if(e.target.classList.contains("d-dn")&&i<CFG.doors.length-1){var b=CFG.doors.splice(i,1)[0];CFG.doors.splice(i+1,0,b)}
  else return;
  drawDoors();fillDoorSelects();drawPreview()});
$("adddoor").onclick=function(){readDoors();
  CFG.doors.push({key:"d"+Date.now().toString(36),subj:"بابٌ جديد",pred:""});
  drawDoors();fillDoorSelects();drawPreview()};
function readDoors(){
  var rows=$("doors").querySelectorAll("[data-di]");
  CFG.doors=[].map.call(rows,function(r,i){
    return {key:CFG.doors[i]?CFG.doors[i].key:"d"+i,
      subj:r.querySelector(".d-subj").value.trim(),
      pred:r.querySelector(".d-pred").value.trim()}}).filter(function(d){return d.subj})}
function readIdentity(){
  var s=CFG.site;
  s.name=$("i_name").value.trim();s.tagline=$("i_tagline").value.trim();s.about=$("i_about").value.trim();
  s.location=$("i_loc").value.trim();s.contactLabel=$("i_clabel").value.trim();s.contactUrl=$("i_curl").value.trim();
  s.portrait=$("i_portrait").value.trim();s.avatarSize=+$("i_avsize").value||66;
  s.avatarCaption=$("i_avcap").value.trim();s.showAvatar=$("i_showav").checked;
  CFG.forms={all:$("f_all").value.trim(),waqfah:$("f_waqfah").value.trim(),shathrah:$("f_shathrah").value.trim()};
  readDoors()}
["i_name","i_tagline","i_about","i_portrait","i_avsize","i_avcap","i_showav"].forEach(function(id){
  $(id).addEventListener("input",function(){readIdentity();drawPreview()})});

/* ---------- المظهر ---------- */
function buildLook(){
  ["colL","colD"].forEach(function(box,bi){
    var key=bi?"dark":"light";
    $(box).innerHTML='<div class="row">'+COLORS.map(function(c){
      return '<div style="min-width:120px"><label>'+c[1]+"</label>"+
        '<input type="color" data-th="'+key+'" data-k="'+c[0]+'" value="'+CFG.theme[key][c[0]]+'"></div>'
    }).join("")+"</div>"});
  var opts=FONTS.map(function(f){return '<option value="'+f+'">'+f+"</option>"}).join("");
  $("t_display").innerHTML=opts;$("t_text").innerHTML=opts;
  var t=CFG.type;
  $("t_display").value=t.display;$("t_text").value=t.text;
  $("t_sm").value=t.sizeMobile;$("t_sd").value=t.sizeDesktop;$("t_lh").value=t.lineHeight;
  $("t_measure").value=t.measure;$("t_ds").value=t.displayScale||1;
  var L=CFG.layout;
  $("l_clamp").value=L.clampChars;$("l_page").value=L.perPage;$("l_gal").value=L.gallery||"grid";
  $("l_rt").checked=L.showReadingTime!==false;$("l_end").checked=L.showEndMark!==false;
  $("l_wide").checked=L.wideMedia!==false;
  var S=CFG.share||{};
  $("s_wa").checked=!!S.whatsapp;$("s_x").checked=!!S.x;$("s_fb").checked=!!S.facebook;
  $("s_tg").checked=!!S.telegram;$("s_cp").checked=S.copy!==false;
  drawPreview()}
function readLook(){
  document.querySelectorAll("[data-th]").forEach(function(i){CFG.theme[i.dataset.th][i.dataset.k]=i.value});
  CFG.type={display:$("t_display").value,text:$("t_text").value,
    sizeMobile:+$("t_sm").value,sizeDesktop:+$("t_sd").value,lineHeight:+$("t_lh").value,
    measure:+$("t_measure").value,displayScale:+$("t_ds").value};
  CFG.layout={clampChars:+$("l_clamp").value,perPage:+$("l_page").value,gallery:$("l_gal").value,
    showReadingTime:$("l_rt").checked,showEndMark:$("l_end").checked,wideMedia:$("l_wide").checked};
  CFG.share={whatsapp:$("s_wa").checked,x:$("s_x").checked,facebook:$("s_fb").checked,
    telegram:$("s_tg").checked,copy:$("s_cp").checked}}
$("tab-look").addEventListener("input",function(){readLook();drawPreview()});
$("tab-look").addEventListener("change",function(){readLook();drawPreview()});
$("resetlook").onclick=function(){
  if(!confirm("إعادة الألوان والخطوط والعرض إلى ما كانت عليه عند آخر فتح؟"))return;
  CFG.theme=JSON.parse(JSON.stringify(DEFAULTS.theme));
  CFG.type=JSON.parse(JSON.stringify(DEFAULTS.type));
  CFG.layout=JSON.parse(JSON.stringify(DEFAULTS.layout));
  buildLook()};

function lum(hex){
  var c=hex.replace("#","");if(c.length===3)c=c.split("").map(function(x){return x+x}).join("");
  var r=parseInt(c.substr(0,2),16)/255,g=parseInt(c.substr(2,2),16)/255,b=parseInt(c.substr(4,2),16)/255;
  function f(v){return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)}
function ratio(a,b){var x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
function guard(){
  var w=[],L=CFG.theme.light,D=CFG.theme.dark;
  [["النهاريّ",L],["الليليّ",D]].forEach(function(p){
    var r1=ratio(p[1].ink,p[1].paper),r2=ratio(p[1].muted,p[1].paper);
    if(r1<4.5)w.push("الوضع "+p[0]+": الحبر على الخلفية "+r1.toFixed(1)+":١ — الحدّ ٤٫٥");
    if(r2<4.5)w.push("الوضع "+p[0]+": النصّ الخافت "+r2.toFixed(1)+":١ — الحدّ ٤٫٥")});
  $("cwarn").className=w.length?"warn on":"warn";
  $("cwarn").innerHTML=w.length?"تباينٌ منخفض يصعب قراءته:<br>"+w.join("<br>"):""}

function drawPreview(){
  if(!CFG)return;
  guard();
  var s=CFG.site,L=CFG.theme.light;
  var bio=CFG.doors.map(function(d){
    return '<span style="color:'+L.accent+'">'+esc(d.subj)+"</span>"+
      (d.pred?' <span style="color:'+L.gold+'">'+esc(d.pred)+"</span>":"")
  }).join(' <span style="color:'+L.rule+'">|</span> ');
  var av=s.showAvatar!==false&&s.portrait
    ? '<img src="'+esc(s.portrait)+'" style="width:'+(s.avatarSize||66)+"px;height:"+(s.avatarSize||66)+
      'px;border-radius:50%;object-fit:cover;display:block;margin:12px auto 6px;border:2px solid '+L.gold+'">'+
      '<div style="text-align:center;font-family:'+CFG.type.display+',serif;font-size:14px;color:'+L.accent+'">'+
      esc(s.avatarCaption||"عن الكاتب")+"</div>":"";
  $("preview").setAttribute("style",pvVars());
  $("preview").innerHTML=
    '<div class="pn">'+esc(s.name)+"</div>"+av+
    '<div class="pend"><i></i><span></span><i></i></div>'+
    '<div style="text-align:center;font-family:'+CFG.type.display+',serif;font-size:16px;line-height:2.1">'+bio+"</div>"+
    '<div style="text-align:center;color:'+L.muted+';font-size:14px;margin-top:12px">'+esc(s.tagline)+"</div>"+
    '<div style="border-top:.5px solid '+L.rule+';margin:20px 0 14px"></div>'+
    '<p class="pm">٢٣ مايو ٢٠٢٥ · <b>'+esc(doorNames()[0]||"")+"</b></p>"+
    '<p class="pt">في المدنِ التي غادرناها تبقى أشياءُ صغيرةٌ لا تُحصى: بابٌ لم يُغلَق جيداً، ورائحةُ مطرٍ على حجرٍ.</p>'+
    (CFG.layout.showEndMark!==false?'<div class="pend"><i></i><span></span><i></i></div>':"")}

/* ---------- الحفظ ---------- */
function put(path,obj,msg){
  return api("/contents/"+path,{method:"PUT",body:JSON.stringify(
    {message:msg,content:b64e(JSON.stringify(obj)),sha:SHA[path],branch:BRANCH})})
  .then(function(r){return r.json().then(function(j){
    if(!r.ok)throw new Error(j.message||"فشل الحفظ");SHA[path]=j.content.sha;return j})})}
function commitData(msg,el){
  el=el||$("lookmsg");say(el,"جارٍ الحفظ…","wait");stt("جارٍ الحفظ…");
  put("data.json",DATA,msg).then(function(){
    say(el,"حُفظ. تظهر التغييرات في المدونة خلال دقيقتين.");
    stt("حُفظ · "+AR(DATA.length)+" مدخلاً");picked={};updBulk();
    if($("form").className==="wrap")setTimeout(function(){$("cancel").click()},1200);else render();
  }).catch(function(e){say(el,e.message,"err");stt("فشل الحفظ")})}
$("savecfg").onclick=function(){
  readIdentity();readLook();
  var el=$("app").querySelector(".wrap:not(.hide) .msg")||$("lookmsg");
  say(el,"جارٍ الحفظ…","wait");
  put("config.json",CFG,"تحديث الإعدادات").then(function(){
    say(el,"حُفظت الإعدادات. تظهر في المدونة خلال دقيقتين.");
    DEFAULTS=JSON.parse(JSON.stringify(CFG));fillDoorSelects();
  }).catch(function(e){say(el,e.message,"err")})};
})();
