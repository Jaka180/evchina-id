/* ============================================================
   EV China Indonesia — 留资表单（独立维护文件）
   ------------------------------------------------------------
   一张干净的品牌表单，客户可【自行选择是否上传照片/视频】，无需登录。
   提交后线索 + 照片进你的 Forminit 后台。
   ------------------------------------------------------------
   提交方式：表单【原生 POST + 隐藏 iframe】，不走 AJAX —— 避免跨域(CORS)被拦。
   提交成功后由 iframe 加载完成触发，跳转到“谢谢”页。
   ============================================================
   ★ 换表单只需改 FORM_CONFIG.endpoint（Forminit 的提交地址）。
   ============================================================ */

const FORM_CONFIG = {
  endpoint: "https://forminit.com/f/5auc8ubx42f",   // 你的 Forminit 提交地址
  successRedirect: "terima-kasih.html",
  maxFileMB: 25                                       // 单文件上限提示（Forminit 免费版 25MB）
};

/* ============================================================
   以下逻辑一般无需改动
   ============================================================ */
function leadFormHTML(){
  return `
  <form class="form-card" id="leadForm"
        action="${FORM_CONFIG.endpoint}" method="POST"
        enctype="multipart/form-data" target="evchina_hidden_iframe">
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
    <p class="note" style="text-align:center;margin-top:12px" data-zh="提交后我们会尽快用 WhatsApp 联系你。">Setelah dikirim, kami akan segera menghubungi via WhatsApp.</p>
  </form>
  <iframe name="evchina_hidden_iframe" id="evchina_hidden_iframe" style="display:none" title="submit"></iframe>
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
  const iframe = document.getElementById("evchina_hidden_iframe");
  let submitted = false;

  form.addEventListener("submit", ()=>{
    // 文件过大保护：>25MB 的照片/视频清掉不上传（Forminit 免费版上限），文字照常提交
    const fileInput = form.querySelector('input[type="file"]');
    if(fileInput && fileInput.files && fileInput.files.length){
      let total = 0;
      for(let i=0;i<fileInput.files.length;i++){ total += fileInput.files[i].size; }
      if(total > (FORM_CONFIG.maxFileMB) * 1024 * 1024){
        fileInput.value = "";  // 清掉大文件，避免上传失败/卡死
        alert("Foto/video terlalu besar (lebih dari " + FORM_CONFIG.maxFileMB + "MB), jadi tidak ikut terkirim. Data Anda tetap kami terima — mohon kirim foto/video-nya via WhatsApp ya. 🙏");
      }
    }
    submitted = true;
    if(btn){ btn.disabled = true; btn.textContent = "..."; }
    // 不 preventDefault：让表单原生 POST 到隐藏 iframe（绕过 CORS）
  });

  if(iframe){
    iframe.addEventListener("load", ()=>{
      if(submitted){ window.location.href = FORM_CONFIG.successRedirect; }
    });
  }
}

document.addEventListener("DOMContentLoaded", initLeadForm);
