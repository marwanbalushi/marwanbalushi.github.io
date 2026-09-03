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

var PRESETS=[
 {n:"حبر وذهب", d:"Amiri", x:"Scheherazade New",
  l:{paper:"#F8F4EE",paper2:"#F1EBE2",ink:"#241F1E",accent:"#5A1F28",gold:"#A8834B",muted:"#6B5A56",rule:"#E2D8CD"},
  k:{paper:"#191614",paper2:"#211D19",ink:"#E9E1D6",accent:"#C9A063",gold:"#C9A063",muted:"#9A9088",rule:"#332C27"}},
 {n:"كحلي ملكي", d:"Amiri", x:"Noto Naskh Arabic",
  l:{paper:"#F4F2EA",paper2:"#EAE7DC",ink:"#1D1C1A",accent:"#16264A",gold:"#9A7B3F",muted:"#55606F",rule:"#D6D2C4"},
  k:{paper:"#12151C",paper2:"#1A1F29",ink:"#E6E9EF",accent:"#9FB6DA",gold:"#C9A063",muted:"#93A0B4",rule:"#2A3140"}},
 {n:"زيتوني", d:"Amiri", x:"Scheherazade New",
  l:{paper:"#F4F1E6",paper2:"#EAE7D8",ink:"#22261F",accent:"#2F3A2C",gold:"#7C8A6B",muted:"#5A6152",rule:"#D3D2C0"},
  k:{paper:"#161813",paper2:"#1E211B",ink:"#E5E7DD",accent:"#A9BC96",gold:"#A9BC96",muted:"#8E9683",rule:"#2C3128"}},
 {n:"ليلي نحاسي", d:"Amiri", x:"Markazi Text",
  l:{paper:"#F7F3EF",paper2:"#EDE7E1",ink:"#201D1B",accent:"#7A3B22",gold:"#B87A55",muted:"#6B5C54",rule:"#DFD5CC"},
  k:{paper:"#17171A",paper2:"#1F1F23",ink:"#ECE7DC",accent:"#D08F68",gold:"#D08F68",muted:"#9A968C",rule:"#33322F"}},
 {n:"رماديّ صحفيّ", d:"Noto Kufi Arabic", x:"Noto Naskh Arabic",
  l:{paper:"#FBFBFA",paper2:"#F1F1EF",ink:"#141414",accent:"#2B2B2B",gold:"#6E6E6E",muted:"#5A5A5A",rule:"#DCDCDA"},
  k:{paper:"#101011",paper2:"#191919",ink:"#F0F0EE",accent:"#D6D6D2",gold:"#B4B4AE",muted:"#9C9C97",rule:"#2C2C2C"}},
 {n:"أخضر عُمانيّ", d:"Aref Ruqaa", x:"Scheherazade New",
  l:{paper:"#F7F5EF",paper2:"#ECE9DF",ink:"#1E211D",accent:"#1F5C3A",gold:"#9E2B2B",muted:"#59614F",rule:"#D8D6C7"},
  k:{paper:"#12160F",paper2:"#1A1F17",ink:"#E7EADF",accent:"#7FBF97",gold:"#D98A8A",muted:"#8D9682",rule:"#28301F"}}
];
function drawPresets(){
  $("presets").innerHTML=PRESETS.map(function(p,i){
    return '<button class="sm" data-ps="'+i+'" style="border-color:'+p.l.accent+
      ';color:'+p.l.accent+'">'+p.n+"</button>"}).join(" ")}


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
    j.tree.forEach(function(f){
      if(/^(data|config|data-recent)\.json$|^(rss|sitemap)\.xml$/.test(f.path))SHA[f.path]=f.sha});
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
    buildIdentity();buildLook();drawPresets();fillDoorSelects();render();mkDraftBtn();
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
    var pv=(b.dataset.t==="look"||b.dataset.t==="identity");
    $("float").className=pv?"on":"";$("fopen").className="";
    if(pv) drawPreview();
  }});

/* ---------- الأبواب في القوائم ---------- */
function doorNames(){return CFG.doors.map(function(d){return d.pred?d.subj+" "+d.pred:d.subj})}
function fillDoorSelects(){
  var names=doorNames();
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

/* ---------- زرّ المسوّدات ---------- */
var DBTN=null;
function mkDraftBtn(){
  if(DBTN)return;
  var a=$("new");if(!a||!a.parentNode)return;
  DBTN=document.createElement("button");
  DBTN.id="draftsBtn";DBTN.type="button";
  DBTN.className=a.className||"sm";
  DBTN.style.marginInlineStart="8px";
  DBTN.onclick=function(){
    var on=$("fstate").value==="draft";
    $("fstate").value=on?"":"draft";
    render();updDraftBtn();
    if(!on)window.scrollTo(0,0)};
  a.parentNode.insertBefore(DBTN,a.nextSibling);

  var RB=document.createElement("button");
  RB.id="rebuildBtn";RB.type="button";RB.className=a.className||"sm";
  RB.style.marginInlineStart="8px";RB.textContent="إعادة بناء الصفحات";
  RB.title="يُعيد بناء صفحات المداخل كلها وتنسيقها وخرائطها من البيانات الحالية";
  RB.onclick=function(){
    var n=DATA.filter(function(e){return !e.draft}).length;
    if(!confirm("سيُعاد بناء "+AR(n)+" صفحة مستقلّة، ومعها التنسيق وخريطة الموقع والتغذية.\n\n"+
      "تستغرق العملية دقائق. لا تُغلق الصفحة حتى تنتهي.\n\nأمتابع؟"))return;
    RB.disabled=true;DBTN.disabled=true;
    rebuildAll().then(function(){
      alert("تمّت إعادة البناء. تظهر على الموقع خلال دقيقتين.");
      RB.disabled=false;DBTN.disabled=false})
    .catch(function(e){
      stt("فشلت إعادة البناء");
      alert("تعذّرت إعادة البناء:\n"+e.message+"\n\nلم يتغيّر شيء في المستودع.");
      RB.disabled=false;DBTN.disabled=false})};
  a.parentNode.insertBefore(RB,DBTN.nextSibling);

  updDraftBtn()}
function updDraftBtn(){
  if(!DBTN)return;
  var n=DATA.filter(function(e){return e.draft}).length;
  var on=$("fstate").value==="draft";
  var col=(CFG&&CFG.theme&&CFG.theme.light)?CFG.theme.light.accent:"#5A1F28";
  DBTN.textContent=on?("عرض الكل ("+AR(n)+" مسوّدة)"):("المسوّدات ("+AR(n)+")");
  DBTN.style.opacity=n?"1":".5";
  DBTN.style.borderColor=on?col:"";
  DBTN.style.color=on?col:"";
  DBTN.style.fontWeight=on?"700":""}

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
  $("more").textContent="المزيد ("+AR(L.length-shown)+")";
  updDraftBtn()}
$("more").onclick=function(){render(true)};
$("q").oninput=function(){render()};
$("fdoor").onchange=function(){render()};
$("fstate").onchange=function(){render();updDraftBtn()};
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
$("pickall").onclick=function(){
  var L=filtered();
  if(L.length>200&&!confirm("سيُحدَّد "+AR(L.length)+" مدخلاً. أمتأكّد؟"))return;
  L.forEach(function(e){picked[e.id]=1});updBulk();render()};
$("bulkclear").onclick=function(){picked={};updBulk();render()};
function okBulk(what){
  var n=Object.keys(picked).length;
  return n && confirm(what+" "+AR(n)+" مدخلاً. لا تراجع بعد الحفظ.\n\nوبعده اضغط «إعادة بناء الصفحات» لتسري التغييرات على الصفحات المستقلّة.\n\nأمتابع؟")}
$("bulkdoor").onchange=function(){
  var name=this.value;if(!name)return;
  if(!okBulk("سيُنقل إلى «"+name+"»")){this.value="";return}
  DATA.forEach(function(e){if(picked[e.id]){e.door=name;e.dk=dkOf(name)}});
  this.value="";commitData("نقل مداخل إلى "+name)};
$("bulkdraft").onclick=function(){
  if(!okBulk("سيُحوَّل إلى مسوّدات"))return;
  DATA.forEach(function(e){if(picked[e.id])e.draft=true});commitData("تحويل إلى مسوّدات")};
$("bulkpub").onclick=function(){
  if(!okBulk("سيُنشر"))return;
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
  $("fdoorsel").value=e?e.door:"متفرّقات";
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
$("presets").addEventListener("click",function(e){
  var b=e.target.closest("[data-ps]");if(!b)return;
  var P=PRESETS[+b.dataset.ps];
  CFG.theme.light=JSON.parse(JSON.stringify(P.l));
  CFG.theme.dark=JSON.parse(JSON.stringify(P.k));
  CFG.type.display=P.d;CFG.type.text=P.x;
  buildLook()});
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

var PVMODE="mast";
document.querySelectorAll("[data-pv]").forEach(function(b){
  b.onclick=function(){PVMODE=b.dataset.pv;
    document.querySelectorAll("[data-pv]").forEach(function(x){x.classList.toggle("on",x===b)});
    drawPreview()}});
$("fmin").onclick=function(){var f=$("float");f.classList.toggle("min");
  this.textContent=f.classList.contains("min")?"▴":"▾"};
$("fclose").onclick=function(){$("float").className="";$("fopen").className="on"};
$("fopen").onclick=function(){$("float").className="on";$("fopen").className="";drawPreview()};

function pvMast(){
  var s=CFG.site,L=CFG.theme.light;
  var bio=CFG.doors.map(function(d){
    return '<span style="color:'+L.accent+'">'+esc(d.subj)+"</span>"+
      (d.pred?' <span style="color:'+L.gold+'">'+esc(d.pred)+"</span>":"")
  }).join(' <span style="color:'+L.rule+'">|</span> ');
  var av=s.showAvatar!==false&&s.portrait
    ? '<img src="'+esc(s.portrait)+'" style="width:'+(s.avatarSize||66)+"px;height:"+(s.avatarSize||66)+
      'px;border-radius:50%;object-fit:cover;display:block;margin:11px auto 5px;border:2px solid '+L.gold+'">'+
      '<div style="text-align:center;font-family:'+CFG.type.display+',serif;font-size:13px;color:'+L.accent+'">'+
      esc(s.avatarCaption||"عن الكاتب")+"</div>":"";
  return '<div class="pn" style="font-size:23px">'+esc(s.name)+"</div>"+av+
    '<div class="pend"><i></i><span></span><i></i></div>'+
    '<div style="text-align:center;font-family:'+CFG.type.display+',serif;font-size:15px;line-height:2.1">'+bio+"</div>"+
    '<div style="text-align:center;color:'+L.muted+';font-size:13px;margin-top:10px">'+esc(s.tagline)+"</div>"}
function pvEntry(){
  var L=CFG.theme.light;
  return '<p class="pm">٢٣ مايو ٢٠٢٥ · <b>'+esc(doorNames()[0]||"")+"</b>"+
    (CFG.layout.showReadingTime!==false?" · ٣ دقائق قراءة":"")+"</p>"+
    '<p class="pt">في المدنِ التي غادرناها تبقى أشياءُ صغيرةٌ لا تُحصى: بابٌ لم يُغلَق جيداً، ورائحةُ مطرٍ على حجرٍ، وصوتُ أذانٍ يعبرُ النافذة في وقتٍ لم نكن نُصغي فيه.\n\nثم نعودُ بعد سنين فلا نجدُ شيئاً في مكانه، ونجدُ كلَّ شيءٍ في الذاكرة.</p>'+
    (CFG.layout.showEndMark!==false?'<div class="pend"><i></i><span></span><i></i></div>':"")}

function drawPreview(){
  if(!CFG)return;
  guard();
  var f=$("float");
  f.setAttribute("style",pvVars());
  $("fbody").innerHTML = PVMODE==="mast" ? pvMast() : pvEntry();}

/* ---------- الحفظ ---------- */

/* ---------- توليد الملفات المرافقة ---------- */
/* ---------- أدوات المزامنة ---------- */
var STATIC_CSS = "[data-contrast=high]{--ink:#000;--muted:#332E2B;--rule:#B4A896}\n[data-theme=dark][data-contrast=high]{--ink:#FFF;--muted:#D2CAC0;--rule:#4E463D}\n[data-clarity=high]{--rulew:1.5px;--lh:2.05;--scale:1.12}\n[data-color=plain]{--accent:var(--ink);--gold:var(--ink)}\n[data-color=plain] .dr{border-bottom:var(--rulew) solid var(--rule);padding-bottom:1px}\n[data-color=plain] .lz{background:var(--muted)}\n[data-color=plain] .subj,[data-color=plain] .pred{color:var(--ink)}\n\n*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}\nbody{margin:0;background:var(--paper);color:var(--ink);font-family:var(--text);\n font-size:var(--body);line-height:var(--lh);letter-spacing:0;padding:0 20px 70px}\na{color:inherit;text-decoration:none}\na:focus-visible,button:focus-visible{outline:3px solid var(--gold);outline-offset:3px}\n.hide{display:none!important}\n\n.tools{max-width:var(--measure);margin:0 auto;display:flex;justify-content:flex-end;\n align-items:center;gap:8px;padding:14px 0 0}\n.tools button{font-family:var(--text);font-size:calc(var(--body)*.66);line-height:1;\n color:var(--muted);background:none;border:var(--rulew) solid var(--rule);border-radius:5px;\n padding:8px 12px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}\n.tools button:hover{color:var(--accent);border-color:var(--gold)}\n.tools svg{width:1.15em;height:1.15em}\n\n.mast{max-width:var(--measure);margin:0 auto;text-align:center;padding:32px 0 26px}\n.name{font-family:var(--display);font-weight:400;\n font-size:calc(clamp(30px,8.5vw,46px)*var(--dscale));line-height:1.45;color:var(--accent);margin:0}\n.fl{display:flex;align-items:center;justify-content:center;gap:9px;margin:15px 0}\n.fl i{display:block;height:var(--rulew);width:48px;background:var(--rule)}\n.lz{width:5px;height:5px;background:var(--gold);transform:rotate(45deg)}\n.subj{color:var(--accent)}.pred{color:var(--gold)}\n.sep{color:var(--rule);padding:0 5px}\n.tag{color:var(--muted);font-size:calc(var(--body)*.74);line-height:1.9;margin:16px auto 0;max-width:24em}\n\nmain{max-width:var(--measure);margin:0 auto}\n.e{padding:32px 0;border-top:var(--rulew) solid var(--rule)}\n.e:first-child{border-top:none}\n.meta{font-size:calc(var(--body)*.6);color:var(--muted);margin:0 0 10px;\n display:flex;align-items:center;gap:7px;flex-wrap:wrap}\n.meta .dr{color:var(--gold)}\n.meta .dot{color:var(--rule)}\n.mk{display:inline-flex;align-items:center;color:var(--gold)}\n.mk svg{width:1.2em;height:1.2em}\n\n.med{margin:0 0 18px}\n.med figure{margin:0 0 8px;display:flex;justify-content:center}\n.med img,.med video{max-width:100%;width:auto;max-height:78vh;border-radius:3px;\n display:block;background:var(--paper2);margin-inline:auto}\n.med.g2,.med.g3{display:grid;gap:8px}\n.med.g2{grid-template-columns:1fr 1fr}\n.med.g3{grid-template-columns:1fr 1fr 1fr}\n.med.g2 figure,.med.g3 figure{margin:0;display:block}\n.med.g2 img,.med.g3 img,.med.g2 video,.med.g3 video{width:100%;height:100%;\n aspect-ratio:1;object-fit:cover;max-height:none}\n.med.stack figure{margin-bottom:10px}\n.wide{max-width:calc(var(--measure) + 6em);margin-inline:auto}\n\n.tx{margin:0;white-space:pre-wrap}\n.end{display:flex;align-items:center;justify-content:center;gap:11px;margin:22px auto 0}\n.end i{display:block;height:var(--rulew);width:32px;background:var(--rule)}\n.end span{width:5px;height:5px;background:var(--gold);transform:rotate(45deg)}\n\n.share{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;\n max-width:var(--measure);margin:26px auto 0;padding-top:20px;\n border-top:var(--rulew) solid var(--rule)}\n.share a,.share button{display:inline-flex;align-items:center;gap:7px;\n font-family:var(--text);font-size:calc(var(--body)*.66);color:var(--muted);\n background:none;border:var(--rulew) solid var(--rule);border-radius:5px;\n padding:8px 14px;cursor:pointer}\n.share a:hover,.share button:hover{color:var(--accent);border-color:var(--gold)}\n.share svg{width:1.05em;height:1.05em}\n\n.foot{max-width:var(--measure);margin:50px auto 0;padding-top:24px;\n border-top:var(--rulew) solid var(--rule);text-align:center;\n font-size:calc(var(--body)*.6);color:var(--muted);line-height:2}\n.foot a{color:var(--accent);border-bottom:var(--rulew) solid var(--gold);padding-bottom:2px}\n.none{text-align:center;color:var(--muted);padding:50px 0;font-size:calc(var(--body)*.8)}\n.back{display:block;max-width:var(--measure);margin:0 auto;padding:14px 0;\n font-family:var(--display);font-size:calc(var(--body)*.75);color:var(--accent)}\n\n/* ===== صفحات المداخل المستقلّة ===== */\n\n.bar,#bar{max-width:var(--measure);margin:0 auto;padding:16px 0 0;\n font-family:var(--display);font-size:calc(var(--body)*.72);color:var(--accent)}\n#bar a{color:var(--accent);border-bottom:var(--rulew) solid var(--gold);padding-bottom:2px}\n\n#post{max-width:var(--measure);margin:0 auto;padding:20px 0 0}\n#post p{margin:0 0 1.05em;white-space:pre-wrap}\n#post p:last-child{margin-bottom:0}\n#post time,#post .date,#post .meta{display:block;font-size:calc(var(--body)*.6);\n color:var(--muted);margin:0 0 16px}\n#post img,#post video{max-width:100%;height:auto;max-height:78vh;border-radius:3px;\n display:block;margin:0 auto 20px;background:var(--paper2)}\n#post figure{margin:0 0 10px}\n\n#share{display:flex;gap:9px;justify-content:center;flex-wrap:wrap;\n max-width:var(--measure);margin:28px auto 0;padding-top:20px;\n border-top:var(--rulew) solid var(--rule)}\n#share a,#share button{display:inline-flex;align-items:center;gap:7px;\n font-family:var(--text);font-size:calc(var(--body)*.66);color:var(--muted);\n background:none;border:var(--rulew) solid var(--rule);border-radius:5px;\n padding:8px 14px;cursor:pointer;text-decoration:none;line-height:1.4}\n#share a:hover,#share button:hover{color:var(--accent);border-color:var(--gold)}\n#share svg{width:1.05em;height:1.05em}\n\n/* ===== أيقونات المشاركة في سطر التاريخ ===== */\n.shx{margin-inline-start:auto;display:inline-flex;align-items:center;gap:5px}\n.shx a,.shx button{display:inline-flex;align-items:center;justify-content:center;\n color:var(--muted);background:none;border:var(--rulew) solid var(--rule);\n border-radius:5px;padding:5px;cursor:pointer;line-height:0}\n.shx a:hover,.shx button:hover{color:var(--accent);border-color:var(--gold)}\n.shx svg{width:1.15em;height:1.15em}\n\n\n/* ===== سهما التنقّل ===== */\n.sup{position:fixed;inset-inline-end:14px;bottom:16px;z-index:40;display:none;\n flex-direction:column;gap:7px}\n.sup button{width:38px;height:38px;display:flex;align-items:center;justify-content:center;\n padding:0;cursor:pointer;border-radius:50%;color:var(--muted);background:var(--paper2);\n border:var(--rulew) solid var(--rule);box-shadow:0 1px 5px rgba(0,0,0,.09);transition:opacity .2s}\n.sup button:hover{color:var(--accent);border-color:var(--gold)}\n.sup svg{width:19px;height:19px}\n@media print{.sup{display:none!important}}\n";

function recentOf(list){return list.filter(function(e){return !e.draft}).slice(0,150)}

function buildCSS(){
  var t=CFG.type,L=CFG.theme.light,D=CFG.theme.dark;
  function vars(o){return Object.keys(o).map(function(k){return "--"+k+":"+o[k]}).join(";")}
  var fams=[t.display,t.text].filter(function(v,i,a){return v&&a.indexOf(v)===i});
  var imp="@import url('https://fonts.googleapis.com/css2?"+fams.map(function(f){
    return "family="+encodeURIComponent(f).replace(/%20/g,"+")+":wght@400;700"}).join("&")+"&display=swap');\n";
  return imp+
    ":root{"+vars(L)+";--rulew:.5px;--scale:1;--lh:"+t.lineHeight+
    ";--sizeM:"+t.sizeMobile+"px;--sizeD:"+t.sizeDesktop+"px;"+
    "--body:calc(var(--sizeM)*var(--scale));--measure:"+t.measure+"em;--dscale:"+(t.displayScale||1)+";"+
    '--display:"'+t.display+'",serif;--text:"'+t.text+'",serif}\n'+
    "@media(min-width:760px){:root{--body:calc(var(--sizeD)*var(--scale))}}\n"+
    "[data-theme=dark]{"+vars(D)+"}\n"+STATIC_CSS}

/* يحذف صفحة مدخل صار مسوّدةً أو حُذف — فلا يبقى مكشوفاً بعد ستره */
function delPage(id){
  var path="p/"+id+".html";
  return api("/contents/"+path+"?ref="+BRANCH).then(function(r){
    if(!r.ok)return null;
    return r.json().then(function(j){
      return api("/contents/"+path,{method:"DELETE",body:JSON.stringify(
        {message:"حذف صفحة مدخل",sha:j.sha,branch:BRANCH})})})
  }).catch(function(){return null})}

/* إعادة بناء كل الصفحات والتنسيق والخرائط في التزام واحد */
function rebuildAll(){
  var pub=DATA.filter(function(e){return !e.draft}),headSha,entries=[];
  stt("جارٍ قراءة المستودع…");
  return api("/git/ref/heads/"+BRANCH).then(function(r){return r.json()}).then(function(ref){
    headSha=ref.object.sha;
    return api("/git/commits/"+headSha).then(function(r){return r.json()})
  }).then(function(cm){
    var baseTree=cm.tree.sha;
    return api("/git/trees/"+baseTree+"?recursive=1").then(function(r){return r.json()})
      .then(function(tr){
        var have={},want={};
        (tr.tree||[]).forEach(function(f){if(/^p\/[^\/]+\.html$/.test(f.path))have[f.path]=1});
        pub.forEach(function(e){
          var p="p/"+e.id+".html";want[p]=1;
          entries.push({path:p,mode:"100644",type:"blob",content:postPage(e)})});
        Object.keys(have).forEach(function(p){
          if(!want[p])entries.push({path:p,mode:"100644",type:"blob",sha:null})});
        entries.push({path:"p/style.css",mode:"100644",type:"blob",content:buildCSS()});
        entries.push({path:"sitemap.xml",mode:"100644",type:"blob",content:buildSitemap()});
        entries.push({path:"rss.xml",mode:"100644",type:"blob",content:buildRSS()});
        entries.push({path:"data-recent.json",mode:"100644",type:"blob",
          content:JSON.stringify(recentOf(DATA))});
        var chunks=[],i;
        for(i=0;i<entries.length;i+=70)chunks.push(entries.slice(i,i+70));
        var chain=Promise.resolve(baseTree),done=0;
        chunks.forEach(function(ch){
          chain=chain.then(function(base){
            return api("/git/trees",{method:"POST",body:JSON.stringify({base_tree:base,tree:ch})})
              .then(function(r){return r.json()}).then(function(j){
                if(!j.sha)throw new Error(j.message||"تعذّر بناء الشجرة");
                done+=ch.length;stt("إعادة البناء… "+AR(done)+" من "+AR(entries.length));
                return j.sha})})});
        return chain})
  }).then(function(finalTree){
    stt("جارٍ الالتزام…");
    return api("/git/commits",{method:"POST",body:JSON.stringify(
      {message:"إعادة بناء الصفحات",tree:finalTree,parents:[headSha]})}).then(function(r){return r.json()})
  }).then(function(cm2){
    if(!cm2.sha)throw new Error(cm2.message||"تعذّر الالتزام");
    return api("/git/refs/heads/"+BRANCH,{method:"PATCH",
      body:JSON.stringify({sha:cm2.sha})}).then(function(r){return r.json()})
  }).then(function(){
    return boot()})}

/* ---------- أيقونات صفحات المداخل ---------- */
var PIC={
 wa:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.9c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5 0a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.5.5 0 0 0 0-.4c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c1.6.6 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
 x:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.2 2H21l-6.6 7.5L22 22h-6.2l-4.8-6.3L5.4 22H2.6l7-8L2 2h6.3l4.4 5.8zM17 20.3h1.6L7.1 3.6H5.4z"/></svg>',
 fb:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
 tg:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9.1-8.2c.4-.4-.1-.6-.6-.2L6.3 12.8 1.5 11.3c-1-.3-1-1 .2-1.5l18.9-7.3c.9-.3 1.6.2 1.3 1.8z"/></svg>',
 cp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
};
function pShare(e,url){
  var S=CFG.share||{},t=encodeURIComponent(snip(e.t,90)),u=encodeURIComponent(url),h='<span class="shx">';
  if(S.whatsapp)h+='<a href="https://wa.me/?text='+t+"%20"+u+'" target="_blank" rel="noopener" title="واتساب" aria-label="مشاركة على واتساب">'+PIC.wa+"</a>";
  if(S.x)h+='<a href="https://x.com/intent/tweet?text='+t+"&url="+u+'" target="_blank" rel="noopener" title="X" aria-label="مشاركة على X">'+PIC.x+"</a>";
  if(S.telegram)h+='<a href="https://t.me/share/url?url='+u+"&text="+t+'" target="_blank" rel="noopener" title="تلغرام" aria-label="مشاركة على تلغرام">'+PIC.tg+"</a>";
  if(S.facebook)h+='<a href="https://www.facebook.com/sharer/sharer.php?u='+u+'" target="_blank" rel="noopener" title="فيسبوك" aria-label="مشاركة على فيسبوك">'+PIC.fb+"</a>";
  if(S.copy!==false)h+='<button id="cpbtn" data-url="'+xe(url)+'" title="نسخ الرابط" aria-label="نسخ الرابط">'+PIC.cp+"</button>";
  return h+"</span>"}
var UPIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>';
var DNIC='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
function pSup(){
  return '<div class="sup" id="sup">'+
    '<button data-go="top" aria-label="إلى أعلى الصفحة" title="إلى الأعلى">'+UPIC+"</button>"+
    '<button data-go="end" aria-label="إلى أسفل الصفحة" title="إلى الأسفل">'+DNIC+"</button></div>"}
function pMedia(e){
  var m=e.m||[];if(!m.length)return "";
  var cls=m.length===1?"":"g2",wide=(e.f==="waqfah"&&CFG.layout.wideMedia!==false)?"wide":"",alt=xe(snip(e.t,100));
  return '<div class="med '+cls+" "+wide+'">'+m.map(function(x){
    if(x.v&&x.vf)return '<figure><video controls preload="metadata" playsinline poster="'+CFG.media.base+"/"+xe(x.f)+
      '" src="'+CFG.media.base+"/"+xe(x.vf)+'#t=0.5"></video></figure>';
    return '<figure><img loading="lazy" src="'+CFG.media.base+"/"+xe(x.f)+'" alt="'+alt+'"></figure>'}).join("")+"</div>"}
function pNav(e){
  var i=DATA.indexOf(e);if(i<0)return "";
  var nx=i>0?DATA[i-1]:null,pv=i+1<DATA.length?DATA[i+1]:null,h="";
  if(nx)h+='<a href="'+xe(nx.id)+'.html" rel="next">→ '+xe(snip(nx.t,34))+"</a>";
  if(pv)h+='<a href="'+xe(pv.id)+'.html" rel="prev">'+xe(snip(pv.t,34))+" ←</a>";
  return h?'<nav class="nb">'+h+"</nav>":""}

var BASEURL="https://marwanbalushi.com/";
function xe(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")}
/* القطع لا يشطر رمزاً تعبيرياً نصفين — فنصفُ الرمز يُعطب دوالّ الترميز */
function cutSafe(s,n){
  if(s.length<=n)return s;
  var c=s.slice(0,n),last=c.charCodeAt(c.length-1);
  if(last>=0xD800&&last<=0xDBFF)c=c.slice(0,-1);
  return c}
function snip(t,n){var s=String(t).replace(/\s+/g," ").trim();
  return s.length>n?cutSafe(s,n)+"…":s}
function rfc(iso){
  var M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var W=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var d=new Date(iso+"T09:00:00+04:00");
  return W[d.getUTCDay()]+", "+String(d.getUTCDate()).padStart(2,"0")+" "+M[d.getUTCMonth()]+
    " "+d.getUTCFullYear()+" 09:00:00 +0400"}
function buildRSS(){
  var pub=DATA.filter(function(e){return !e.draft}).slice(0,60);
  var items=pub.map(function(e){
    return "<item><title>"+xe(snip(e.t,70))+"</title><link>"+BASEURL+"p/"+e.id+".html</link>"+
      '<guid isPermaLink="false">'+e.id+"</guid><pubDate>"+rfc(e.iso)+"</pubDate>"+
      "<category>"+xe(e.door)+"</category><description>"+xe(snip(e.t,400))+"</description></item>"}).join("");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>'+
    xe(CFG.site.name)+"</title><link>"+BASEURL+"</link><description>"+xe(CFG.site.tagline)+
    "</description><language>ar</language>"+(pub[0]?"<lastBuildDate>"+rfc(pub[0].iso)+"</lastBuildDate>":"")+
    items+"</channel></rss>"}
function buildSitemap(){
  var pub=DATA.filter(function(e){return !e.draft});
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+
    "<url><loc>"+BASEURL+"</loc><changefreq>daily</changefreq><priority>1.0</priority></url>"+
    pub.map(function(e){return "<url><loc>"+BASEURL+"p/"+e.id+".html</loc><lastmod>"+xe(e.iso)+"</lastmod></url>"}).join("")+
    "</urlset>"}
function postPage(e){
  var img=BASEURL+"card.jpg";
  (e.m||[]).some(function(m){if(!m.vf){img=CFG.media.base+"/"+m.f;return true}return false});
  var url=BASEURL+"p/"+e.id+".html";
  var T=xe(snip(e.t,65)),Dsc=xe(snip(e.t,155));
  var rt=(CFG.layout.showReadingTime!==false&&e.t.length>400)
    ? '<span class="dot">·</span>'+AR(Math.max(1,Math.round(e.t.trim().split(/\s+/).length/180)))+" دقيقة قراءة":"";
  var meta='<time datetime="'+xe(e.iso)+'">'+xe(e.d)+"</time>"+
    (e.dk?'<span class="dot">·</span><span class="dr">'+xe(e.door)+"</span>":"")+rt+pShare(e,url);
  var tok=(CFG.analytics&&CFG.analytics.cloudflareToken)||"";
  var S="script";
  var prefs="<"+S+">(function(){try{var R=document.documentElement,g=function(k){return localStorage.getItem(k)};"+
    "R.setAttribute('data-theme',g('theme')||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));"+
    "R.setAttribute('data-contrast',g('contrast')||'normal');R.setAttribute('data-clarity',g('clarity')||'normal');"+
    "R.setAttribute('data-color',g('color')||'full');var s=parseFloat(g('scale'));if(s)R.style.setProperty('--scale',s);}catch(e){}})();</"+S+">";
  var cpjs="<"+S+">(function(){var b=document.getElementById('cpbtn');if(!b)return;var o=b.innerHTML,u=b.dataset.url;"+
    "var OK='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.1\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 6L9 17l-5-5\"/></svg>';"+
    "b.onclick=function(){var d=function(){b.innerHTML=OK;setTimeout(function(){b.innerHTML=o},1600)};"+
    "if(navigator.clipboard)navigator.clipboard.writeText(u).then(d,d);else{var i=document.createElement('input');i.value=u;"+
    "document.body.appendChild(i);i.select();try{document.execCommand('copy')}catch(x){}i.remove();d()}}})();</"+S+">";
  var supjs="<"+S+">(function(){var d=document.getElementById('sup');if(!d)return;"+
    "function u(){var h=document.documentElement.scrollHeight,v=innerHeight,y=scrollY||0;"+
    "d.style.display=h>v*1.8?'flex':'none';d.children[0].style.opacity=y>220?'1':'.35';"+
    "d.children[1].style.opacity=y<h-v-60?'1':'.35'}"+
    "d.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;"+
    "scrollTo({top:b.dataset.go==='top'?0:document.documentElement.scrollHeight,behavior:'smooth'})});"+
    "addEventListener('scroll',u,{passive:true});addEventListener('resize',u);u()})();</"+S+">";
  var beacon=tok?"<"+S+" defer src=\"https://static.cloudflareinsights.com/beacon.min.js\" data-cf-beacon='{\"token\":\""+tok+"\"}'></"+S+">":"";
  return '<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="utf-8">\n'+
   '<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>'+T+"</title>\n"+
   '<meta name="description" content="'+Dsc+'">\n<link rel="canonical" href="'+url+'">\n'+
   '<meta property="og:type" content="article">\n<meta property="og:site_name" content="'+xe(CFG.site.name)+'">\n'+
   '<meta property="og:title" content="'+T+'">\n<meta property="og:description" content="'+Dsc+'">\n'+
   '<meta property="og:url" content="'+url+'">\n<meta property="og:image" content="'+xe(img)+'">\n'+
   '<meta property="og:locale" content="ar_OM">\n<meta property="article:published_time" content="'+xe(e.iso)+'">\n'+
   '<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="'+T+'">\n'+
   '<meta name="twitter:description" content="'+Dsc+'">\n<meta name="twitter:image" content="'+xe(img)+'">\n'+
   '<meta name="theme-color" content="'+CFG.theme.light.accent+'">\n'+
   '<link rel="icon" href="../icon-192.png">\n<link rel="apple-touch-icon" href="../apple-touch-icon.png">\n'+
   '<link rel="alternate" type="application/rss+xml" title="'+xe(CFG.site.name)+'" href="../rss.xml">\n'+
   '<link rel="stylesheet" href="style.css">\n'+prefs+'\n</head>\n<body>\n'+
   '<div class="bar"><a href="../index.html">→ العودة إلى المدونة</a></div>\n'+
   '<main id="post">\n<article class="e">\n<p class="meta">'+meta+"</p>\n"+pMedia(e)+
   '<p class="tx">'+xe(e.t)+"</p>\n"+
   (CFG.layout.showEndMark!==false?'<div class="end" aria-hidden="true"><i></i><span></span><i></i></div>\n':"")+
   "</article>\n</main>\n"+pNav(e)+"\n"+
   '<footer class="foot">\n<div class="fl" aria-hidden="true"><i></i><span class="lz"></span><i></i></div>\n'+
   '<a href="../index.html#/archive">الأرشيف الزمني</a><br>'+xe(CFG.site.name)+
   (CFG.site.location?" · "+xe(CFG.site.location):"")+"\n</footer>\n"+pSup()+"\n"+cpjs+supjs+beacon+"\n</body>\n</html>\n"}
function putRaw(path,text,msg){
  var body={message:msg,content:b64e(text),branch:BRANCH};
  if(SHA[path])body.sha=SHA[path];
  return api("/contents/"+path,{method:"PUT",body:JSON.stringify(body)})
   .then(function(r){return r.json()}).then(function(j){
     if(j.content&&j.content.sha)SHA[path]=j.content.sha;return j})}

function put(path,obj,msg){
  return api("/contents/"+path,{method:"PUT",body:JSON.stringify(
    {message:msg,content:b64e(JSON.stringify(obj)),sha:SHA[path],branch:BRANCH})})
  .then(function(r){return r.json().then(function(j){
    if(!r.ok)throw new Error(j.message||"فشل الحفظ");SHA[path]=j.content.sha;return j})})}
function commitData(msg,el){
  el=el||$("lookmsg");say(el,"جارٍ الحفظ…","wait");stt("جارٍ الحفظ…");
  var pageOp=null;
  if(cur){
    var alive=DATA.indexOf(cur)>-1;
    pageOp=(alive&&!cur.draft)
      ? function(){return putRaw("p/"+cur.id+".html",postPage(cur),"صفحة مدخل")}
      : function(){return delPage(cur.id)}}
  put("data.json",DATA,msg).then(function(){
    return pageOp?pageOp():null
  }).then(function(){
    return putRaw("data-recent.json",JSON.stringify(recentOf(DATA)),"تحديث الدفعة الأولى")
  }).then(function(){
    return putRaw("rss.xml",buildRSS(),"تحديث التغذية")
  }).then(function(){
    return putRaw("sitemap.xml",buildSitemap(),"تحديث خريطة الموقع")
  }).then(function(){
    say(el,"حُفظ. تظهر التغييرات في المدونة خلال دقيقتين.");
    stt("حُفظ · "+AR(DATA.length)+" مدخلاً");picked={};updBulk();
    if($("form").className==="wrap")setTimeout(function(){$("cancel").click()},1200);else render();
  }).catch(function(e){say(el,e.message,"err");stt("فشل الحفظ")})}
$("savecfg").onclick=function(){
  readIdentity();readLook();
  var el=$("app").querySelector(".wrap:not(.hide) .msg")||$("lookmsg");
  say(el,"جارٍ الحفظ…","wait");
  put("config.json",CFG,"تحديث الإعدادات").then(function(){
    return putRaw("p/style.css",buildCSS(),"تحديث تنسيق الصفحات")
  }).then(function(){
    say(el,"حُفظت الإعدادات — وسرت على الصفحات المستقلّة أيضاً. تظهر خلال دقيقتين.");
    DEFAULTS=JSON.parse(JSON.stringify(CFG));fillDoorSelects();
  }).catch(function(e){say(el,e.message,"err")})};
})();
