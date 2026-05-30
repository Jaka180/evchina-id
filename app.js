/* ============================================================
   EV China Indonesia — evchina.id  原型脚本（核心）
   功能：印尼语/中文切换、WhatsApp 链接、移动菜单
   注：留资表单已独立到 lead-form.js，请在该文件维护表单
   ============================================================ */

/* ⬇⬇⬇ 把这里改成你自己的 WhatsApp 号（国际格式，不含+，印尼为62开头） ⬇⬇⬇ */
const WA_NUMBER = "628212139082";
/* ⬆⬆⬆ 例如 6281234567890 */
window.EV_WA_NUMBER = WA_NUMBER;

const LANG_KEY = "evchina_lang";

/* ---------- 语言切换（印尼语 id 默认 / 中文 zh 预览） ---------- */
function getLang(){ return localStorage.getItem(LANG_KEY) || "id"; }

/* 扫描页面，记录尚未记录的印尼语原文（支持后注入的元素，如表单） */
function scanI18n(){
  document.querySelectorAll("[data-zh]").forEach(el=>{
    if(el.dataset.orig === undefined) el.dataset.orig = el.textContent;
  });
  document.querySelectorAll("[data-zh-ph]").forEach(el=>{
    if(el.dataset.origPh === undefined) el.dataset.origPh = el.getAttribute("placeholder") || "";
  });
}

function applyLang(lang){
  document.documentElement.lang = (lang==="zh") ? "zh" : "id";
  document.querySelectorAll("[data-zh]").forEach(el=>{
    el.textContent = (lang==="zh") ? el.dataset.zh : el.dataset.orig;
  });
  document.querySelectorAll("[data-zh-ph]").forEach(el=>{
    el.setAttribute("placeholder", (lang==="zh") ? el.dataset.zhPh : el.dataset.origPh);
  });
  const btn = document.getElementById("langToggle");
  if(btn) btn.textContent = (lang==="zh") ? "Bahasa Indonesia" : "中文预览";
  localStorage.setItem(LANG_KEY, lang);
}

function toggleLang(){ applyLang(getLang()==="zh" ? "id" : "zh"); }

/* 供后注入内容（表单）调用：重新扫描并应用当前语言 */
function refreshI18n(){ scanI18n(); applyLang(getLang()); }

/* ---------- WhatsApp 链接 ---------- */
function wireWhatsApp(){
  const defaultMsg = "Halo, saya butuh bantuan diagnosa mobil listrik China.";
  document.querySelectorAll(".js-wa").forEach(a=>{
    if(a.dataset.waWired) return;
    const txt = a.dataset.waText || defaultMsg;
    a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`;
    a.target = "_blank";
    a.rel = "noopener";
    a.dataset.waWired = "1";
  });
}

/* ---------- 移动菜单 ---------- */
function initMenu(){
  const ham = document.getElementById("hamburger");
  const links = document.getElementById("navLinks");
  if(ham && links){
    ham.addEventListener("click", ()=> links.classList.toggle("open"));
    links.querySelectorAll("a").forEach(a=> a.addEventListener("click", ()=> links.classList.remove("open")));
  }
}

/* 暴露给 lead-form.js 使用 */
window.EVChina = { applyLang, getLang, refreshI18n, wireWhatsApp };

document.addEventListener("DOMContentLoaded", ()=>{
  const dev = new URLSearchParams(location.search).get("dev") === "1";
  scanI18n();
  applyLang(dev ? getLang() : "id");   // 公众恒为印尼语；?dev=1 才允许中文预览
  wireWhatsApp();
  initMenu();
  if(dev){
    document.querySelectorAll(".dev-banner,.lang-toggle").forEach(e=>{ e.style.display = ""; });
    const lt = document.getElementById("langToggle");
    if(lt) lt.addEventListener("click", toggleLang);
  }
});
