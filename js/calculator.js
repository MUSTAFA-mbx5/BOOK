import { initTheme } from './theme.js';
import { finalPrice, formatPrice } from './pricing.js';

initTheme();
document.getElementById('year').textContent = new Date().getFullYear();

// Tabs
document.querySelectorAll('.calc-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.calc-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.calc-panel').forEach(p => p.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab + 'Tab').classList.remove('hidden');
  });
});

// حساب يدوي
document.getElementById('calcManualBtn').addEventListener('click', () => {
  const pages = parseInt(document.getElementById('pagesInput').value, 10);
  if (!pages || pages < 1) {
    showResult('manualResult', null, 'يرجى إدخال عدد صفحات صحيح (1 أو أكثر)');
    return;
  }
  const price = finalPrice(pages);
  showResult('manualResult', price, `عدد الصفحات: ${pages}`);
});

function showResult(id, price, detail) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  if (price === null) {
    el.innerHTML = `<div class="result-label">${detail}</div>`;
    return;
  }
  el.innerHTML = `
    <div class="result-label">السعر النهائي</div>
    <div class="result-value">${formatPrice(price)}</div>
    <div class="result-detail">${detail}</div>`;
}

// PDF
const dropZone = document.getElementById('dropZone');
const pdfInput = document.getElementById('pdfInput');
const pdfInfo = document.getElementById('pdfInfo');
const pdfResult = document.getElementById('pdfResult');
const resetBtn = document.getElementById('resetPdfBtn');

dropZone.addEventListener('click', () => pdfInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handlePDF(e.dataTransfer.files[0]);
});
pdfInput.addEventListener('change', e => {
  if (e.target.files.length) handlePDF(e.target.files[0]);
});
resetBtn.addEventListener('click', () => {
  pdfInput.value = '';
  pdfInfo.classList.add('hidden');
  pdfResult.classList.add('hidden');
  resetBtn.classList.add('hidden');
  dropZone.classList.remove('hidden');
});

async function handlePDF(file) {
  if (file.type !== 'application/pdf') return alert('الرجاء اختيار ملف PDF صالح');
  if (file.size > 20 * 1024 * 1024) return alert('حجم الملف أكبر من 20 ميجابايت');

  try {
    if (!window.pdfjsLib) await loadPdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = pdf.numPages;
    const price = finalPrice(pages);

    pdfInfo.classList.remove('hidden');
    pdfInfo.innerHTML = `
      <div class="pdf-name">📄 ${file.name}</div>
      <div class="pdf-pages">عدد الصفحات: ${pages}</div>`;
    pdfResult.classList.remove('hidden');
    pdfResult.innerHTML = `
      <div class="result-label">السعر النهائي للطباعة</div>
      <div class="result-value">${formatPrice(price)}</div>
      <div class="result-detail">${pages} صفحة</div>`;
    resetBtn.classList.remove('hidden');
    dropZone.classList.add('hidden');
  } catch (err) {
    console.error(err);
    alert('تعذّر قراءة الملف. قد يكون تالفاً أو غير مدعوم.');
  }
}

function loadPdfJs() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
