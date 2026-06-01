/* ============================================================
   EV China Indonesia — 留资表单（独立维护文件）
   ------------------------------------------------------------
   提交直接进你自己的 Supabase：
     · 线索文字 → Postgres 表 leads
     · 照片     → Storage 桶 lead-photos
   浏览器直连 Supabase（用 publishable key，受 RLS 保护，安全）。
   ============================================================ */

const SB_URL = "https://lodzuuxgpansscpfgtcf.supabase.co";
const SB_KEY = "sb_publishable_Xg7qubOA7_k5fP_yV5uRHQ_Si2R1LC8";
const SB_BUCKET = "lead-photos";

const FORM_CONFIG = {
  successRedirect: "terima-kasih.html",
  maxTotalMB: 25      // 照片总大小上限；超了不上传，提示走 WhatsApp
};

let _sb = null;

/* 动态加载 supabase-js（UMD）并初始化客户端 */
function ensureSupabase(){
  return new Promise((resolve, reject)=>{
    if(_sb){ resolve(_sb); return; }
    const init = ()=>{
      try{ _sb = window.supabase.createClient(SB_URL, SB_KEY); resolve(_sb); }
      catch(e){ reject(e); }
    };
    if(window.supabase && window.supabase.createClient){ init(); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    s.onload = init;
    s.onerror = ()=> reject(new Error("supabase load failed"));
    document.head.appendChild(s);
  });
}

function uuid(){
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
    const r=Math.random()*16|0, v=c==="x"?r:(r&0x3|0x8); return v.toString(16);
  });
}

function leadFormHTML(){
  return `
  <form class="form-card" id="leadForm" novalidate>
    <h3 style="margin-bottom:6px" data-zh="留下信息，我们主动联系你">Tinggalkan Data, Kami yang Menghubungi Anda</h3>
    <p class="note" style="margin-bottom:18px" data-zh="只需 30 秒。照片可传可不传——传了诊断更准。">Cukup 30 detik. Foto opsional — kalau ada, diagnosa lebih akurat.</p>
    <div class="form-row">
      <label data-zh="姓名">Nama</label>
      <input name="nama" required placeholder="Nama Anda" data-zh-ph="您的姓名">
    </div>
    <div class="form-row">
      <label data-zh="WhatsApp 号码">Nomor WhatsApp</label>
      <div class="phone-wrap">
        <span class="phone-prefix">🇮🇩 +62</span>
        <input name="whatsapp" type="tel" inputmode="numeric" required placeholder="812 3456 789" data-zh-ph="不带开头的 0，如 812…">
      </div>
      <p class="note" style="margin-top:5px" data-zh="不用填开头的 0（例：0812… → 填 812…）">Tanpa angka 0 di depan (contoh: 0812… → tulis 812…)</p>
    </div>
    <div class="form-row">
      <label data-zh="城市">Kota</label>
      <input name="kota" placeholder="Jakarta / Surabaya / ..." data-zh-ph="所在城市">
    </div>
    <div class="form-row">
      <label data-zh="车辆品牌与车型">Merek & Model Mobil</label>
      <input name="mobil" placeholder="BYD Atto 3 / Wuling Air EV / ..." data-zh-ph="品牌+车型，如 BYD Atto 3">
    </div>
    <div class="form-row">
      <label data-zh="故障描述">Deskripsi Masalah</label>
      <textarea name="masalah" placeholder="Ceritakan singkat masalah mobil Anda..." data-zh-ph="简单描述车辆故障…"></textarea>
    </div>
    <div class="form-row">
      <label data-zh="故障照片/视频（选填，可多选）">Foto/Video Kerusakan (opsional, boleh beberapa)</label>
      <label class="file-btn">
        <input type="file" name="foto" accept="image/*,video/*" multiple style="display:none">
        <span data-zh="📎 选择照片/视频">📎 Pilih Foto/Video</span>
      </label>
      <span class="file-names" id="fileNames" data-zh="未选择文件">Belum ada file dipilih</span>
      <p class="note" style="margin-top:6px" data-zh="选填。文件太大（>25MB）建议改用 WhatsApp 发。">Opsional. File besar (>25MB) lebih baik dikirim via WhatsApp.</p>
    </div>
    <button type="submit" class="btn btn-wa" data-zh="提交">Kirim Sekarang</button>
    <p class="note" id="formMsg" style="text-align:center;margin-top:12px" data-zh="提交后我们会尽快用 WhatsApp 联系你。">Setelah dikirim, kami akan segera menghubungi via WhatsApp.</p>
  </form>
  `;
}

function initLeadForm(){
  const mounts = document.querySelectorAll("#lead-form-mount");
  if(!mounts.length) return;
  mounts.forEach(m => { m.innerHTML = leadFormHTML(); });
  if(window.EVChina){ window.EVChina.refreshI18n(); window.EVChina.wireWhatsApp(); }
  ensureSupabase().catch(()=>{});   // 预加载

  const form = document.getElementById("leadForm");
  if(!form) return;
  const btn = form.querySelector('button[type="submit"]');
  const btnOrig = btn ? btn.textContent : "Kirim";
  const g = (n)=> (form.querySelector(`[name="${n}"]`)?.value || "").trim();

  // 选好文件后，显示文件名（自定义按钮）
  const fileInput = form.querySelector('input[type="file"]');
  const fileNames = form.querySelector('#fileNames');
  if(fileInput && fileNames){
    fileInput.addEventListener("change", ()=>{
      const fs = fileInput.files;
      if(!fs || !fs.length){ fileNames.textContent = "Belum ada file dipilih"; }
      else if(fs.length === 1){ fileNames.textContent = "✅ " + fs[0].name; }
      else { fileNames.textContent = "✅ " + fs.length + " file dipilih"; }
    });
  }

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    if(btn){ btn.disabled = true; btn.textContent = "..."; }

    try{
      const sb = await ensureSupabase();
      const id = uuid();

      // 照片：大小检查 + 上传
      const fileInput = form.querySelector('input[type="file"]');
      const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
      let total = 0; files.forEach(f=> total += f.size);
      const photoPaths = [];
      if(files.length && total > FORM_CONFIG.maxTotalMB * 1024 * 1024){
        alert("Foto/video terlalu besar (lebih dari " + FORM_CONFIG.maxTotalMB + "MB) jadi tidak ikut terkirim. Data Anda tetap kami terima — mohon kirim foto/video-nya via WhatsApp ya. 🙏");
      } else {
        for(const f of files){
          const safe = (f.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
          const path = `${id}/${Date.now()}_${safe}`;
          const up = await sb.storage.from(SB_BUCKET).upload(path, f, { upsert:false });
          if(!up.error) photoPaths.push(path);
        }
      }

      // 写入线索
      const source = new URLSearchParams(location.search).get("utm_source") || document.referrer || "";
      // 规范 WhatsApp 为国际格式 62xxxx（前缀已是 +62，去掉用户多打的 0/62）
      let waD = g("whatsapp").replace(/\D/g, "");
      if(waD.startsWith("0"))  waD = waD.slice(1);
      if(waD.startsWith("62")) waD = waD.slice(2);
      const waFull = waD ? "62" + waD : "";

      const { error } = await sb.from("leads").insert({
        id,
        nama: g("nama"),
        whatsapp: waFull,
        kota: g("kota"),
        brand_model: g("mobil"),
        problem: g("masalah"),
        photo_paths: photoPaths,
        source: source.slice(0, 300)
      });
      if(error) throw error;

      window.location.href = FORM_CONFIG.successRedirect;
    }catch(err){
      if(btn){ btn.disabled = false; btn.textContent = btnOrig; }
      alert("Maaf, pengiriman gagal. Silakan coba lagi, atau hubungi kami langsung lewat tombol WhatsApp. 🙏");
      console.error("lead submit error:", err);
    }
  });
}

document.addEventListener("DOMContentLoaded", initLeadForm);
