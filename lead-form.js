/* ============================================================
   EV China Indonesia — 留资表单（独立维护文件）
   ------------------------------------------------------------
   一张干净的品牌表单，客户可【自行选择是否上传照片/视频】，无需登录。
   提交后线索 + 照片一起进你的 Forminit 后台（可同步邮箱/Google 表格）。
   —— 不再需要两张 Google 表单，也不用 VLOOKUP 配对。
   ============================================================
   ★ 你只需做一件事：去 Forminit 建一个表单，拿到「提交地址(endpoint)」，
     填到下面 FORM_CONFIG.endpoint。详见《表单设置说明.md》。
   ============================================================ */

const FORM_CONFIG = {
  // Forminit（原 Getform）的表单提交地址，形如 https://forminit.com/f/xxxxxxxx
  endpoint: "https://forminit.com/f/5auc8ubx42f",   // 你的 Forminit 提交地址（已填好）
  successRedirect: "terima-kasih.html",
  fallbackToWhatsApp: true,     // endpoint 没填时，临时回退到 WhatsApp（无法带照片）
  maxFileMB: 25                 // 单文件大小上限提示（Forminit 免费版 25MB）
};

/* ============================================================
   以下逻辑一般无需改动
   ============================================================ */
function isFormConfigured(){
  return !!FORM_CONFIG.endpoint && FORM_CONFIG.endpoint.indexOf("http") === 0;
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
      <input name="whatsapp" required placeholder="08xxxxxxxxxx" data-zh-ph="您的 WhatsApp 号">
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
      <input type="file" name="foto" accept="image/*,video/*" multiple>
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

  const form = document.getElementById("leadForm");
  if(!form) return;
  const btn = form.querySelector('button[type="submit"]');
  const btnOrig = btn ? btn.textContent : "";

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }

    // 未配置 Forminit → 回退 WhatsApp（无法带照片）
    if(!isFormConfigured()){
      if(!FORM_CONFIG.fallbackToWhatsApp){ alert("表单未配置，请见《表单设置说明.md》。"); return; }
      const g = (n)=> (form.querySelector(`[name="${n}"]`)?.value || "").trim();
      const text = "Halo EV China, saya ingin minta bantuan:\n"+
        "Nama: "+g("nama")+"\nWhatsApp: "+g("whatsapp")+"\nKota: "+g("kota")+
        "\nMobil: "+g("mobil")+"\nMasalah: "+g("masalah");
      const num = window.EV_WA_NUMBER || "62XXXXXXXXXX";
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
      window.location.href = FORM_CONFIG.successRedirect;
      return;
    }

    // 正式提交到 Forminit（含照片）
    if(btn){ btn.disabled = true; btn.textContent = "..."; }
    try{
      const res = await fetch(FORM_CONFIG.endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });
      if(res.ok){
        window.location.href = FORM_CONFIG.successRedirect;
      } else {
        throw new Error("submit failed");
      }
    }catch(err){
      // 出错则回退 WhatsApp，避免丢线索
      const g = (n)=> (form.querySelector(`[name="${n}"]`)?.value || "").trim();
      const text = "Halo EV China, saya ingin minta bantuan:\n"+
        "Nama: "+g("nama")+"\nWhatsApp: "+g("whatsapp")+"\nKota: "+g("kota")+
        "\nMobil: "+g("mobil")+"\nMasalah: "+g("masalah");
      const num = window.EV_WA_NUMBER || "62XXXXXXXXXX";
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
      if(btn){ btn.disabled = false; btn.textContent = btnOrig; }
    }
  });
}

document.addEventListener("DOMContentLoaded", initLeadForm);
