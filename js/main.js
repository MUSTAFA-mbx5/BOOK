import { initTheme } from './theme.js';
import { finalPrice, formatPrice } from './pricing.js';
import { getDeliveryCost, getDeliveryName } from './delivery.js';
import { openWhatsApp, buildSingleBookMessage, buildMultiBookMessage } from './whatsapp.js';

let booksData = null;
let activeStage = null;
let activeGrade = null;
const selectedBooks = new Set();
let currentSearch = '';
let currentSort = 'default';

const $ = (id) => document.getElementById(id);

async function init() {
  initTheme();
  $('year').textContent = new Date().getFullYear();

  try {
    const res = await fetch('data/books.json');
    if (!res.ok) throw new Error('فشل تحميل البيانات');
    booksData = await res.json();
  } catch (err) {
    console.error(err);
    $('stageTabs').innerHTML = '<p style="padding:1rem;color:#ef4444">تعذّر تحميل البيانات. تأكد من وجود data/books.json ثم شغّل الموقع عبر خادم محلي.</p>';
    return;
  }

  renderStageTabs();
  setupSearch();
  setupSort();
  setupDelivery();
}

function renderStageTabs() {
  const c = $('stageTabs');
  c.innerHTML = '';
  booksData.stages.forEach((stage, i) => {
    const btn = document.createElement('button');
    btn.className = 'stage-tab' + (i === 0 ? ' active' : '');
    btn.textContent = stage.name;
    btn.addEventListener('click', () => selectStage(stage.id));
    c.appendChild(btn);
  });
  if (booksData.stages.length) selectStage(booksData.stages[0].id);
}

function selectStage(stageId) {
  activeStage = booksData.stages.find(s => s.id === stageId);
  if (!activeStage) return;
  document.querySelectorAll('.stage-tab').forEach(t =>
    t.classList.toggle('active', t.textContent === activeStage.name)
  );
  renderGradeGrid();
  $('booksSection').classList.add('hidden');
  $('deliverySection').classList.add('hidden');
}

function renderGradeGrid() {
  const grid = $('gradeGrid');
  grid.innerHTML = '';
  activeStage.grades.forEach(grade => {
    const card = document.createElement('div');
    card.className = 'grade-card';
    card.innerHTML = `
      <div class="grade-icon">🎓</div>
      <h3>${grade.name}</h3>
      <div class="grade-meta">${grade.books.length} مادة</div>`;
    card.addEventListener('click', () => selectGrade(grade.id));
    grid.appendChild(card);
  });
}

function selectGrade(gradeId) {
  activeGrade = activeStage.grades.find(g => g.id === gradeId);
  if (!activeGrade) return;
  document.querySelectorAll('.grade-card').forEach(c =>
    c.classList.toggle('active', c.querySelector('h3').textContent === activeGrade.name)
  );
  selectedBooks.clear();
  currentSearch = '';
  currentSort = 'default';
  $('searchInput').value = '';
  $('sortSelect').value = 'default';
  $('clearSearch').classList.add('hidden');
  $('deliverySelect').value = '';

  $('currentGradeTitle').textContent = activeGrade.name;
  $('currentGradeMeta').textContent = `${activeGrade.books.length} مادة دراسية`;
  $('booksSection').classList.remove('hidden');
  $('deliverySection').classList.remove('hidden');

  renderBooks();
  updateSummary();

  setTimeout(() => $('booksSection').scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function findBookByKey(key) {
  const [gradeId, name] = key.split('::');
  if (!activeGrade || activeGrade.id !== gradeId) return null;
  const raw = activeGrade.books.find(b => b.name === name);
  if (!raw) return null;
  return { ...raw, price: finalPrice(raw.pages) };
}

function getFilteredBooks() {
  if (!activeGrade) return [];
  let books = activeGrade.books.map(b => ({ ...b, price: finalPrice(b.pages) }));
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    books = books.filter(b => b.name.toLowerCase().includes(q));
  }
  switch (currentSort) {
    case 'name-asc':  books.sort((a, b) => a.name.localeCompare(b.name, 'ar')); break;
    case 'name-desc': books.sort((a, b) => b.name.localeCompare(a.name, 'ar')); break;
    case 'price-asc': books.sort((a, b) => a.price - b.price); break;
    case 'price-desc':books.sort((a, b) => b.price - a.price); break;
  }
  return books;
}

function renderBooks() {
  const books = getFilteredBooks();
  const tbody = $('booksBody');
  const tfoot = $('booksFooter');
  const noResults = $('noResults');
  tbody.innerHTML = '';

  if (!books.length) {
    noResults.classList.remove('hidden');
    tfoot.innerHTML = '';
    return;
  }
  noResults.classList.add('hidden');

  books.forEach(book => {
    const key = activeGrade.id + '::' + book.name;
    const isSelected = selectedBooks.has(key);
    const tr = document.createElement('tr');
    if (isSelected) tr.classList.add('selected');
    tr.innerHTML = `
      <td><input type="checkbox" class="checkbox" data-key="${key}" ${isSelected ? 'checked' : ''}></td>
      <td class="book-name">${book.name}</td>
      <td class="book-pages">${book.pages}</td>
      <td class="book-price">${formatPrice(book.price)}</td>
      <td class="col-action"><button class="btn-order-single" data-key="${key}">📱 طلب</button></td>`;
    tbody.appendChild(tr);
  });

  const totalPrice = books.reduce((s, b) => s + b.price, 0);
  const totalPages = books.reduce((s, b) => s + b.pages, 0);
  tfoot.innerHTML = `
    <tr>
      <td colspan="2">المجموع (${books.length} مادة)</td>
      <td>${totalPages} صفحة</td>
      <td class="book-price">${formatPrice(totalPrice)}</td>
      <td></td>
    </tr>`;

  tbody.querySelectorAll('.checkbox').forEach(cb => {
    cb.addEventListener('change', e => {
      const key = e.target.dataset.key;
      if (e.target.checked) {
        selectedBooks.add(key);
        e.target.closest('tr').classList.add('selected');
        showToast('✓ تمت إضافة المادة');
      } else {
        selectedBooks.delete(key);
        e.target.closest('tr').classList.remove('selected');
        showToast('تم إلغاء التحديد');
      }
      updateSummary();
    });
  });

  tbody.querySelectorAll('.btn-order-single').forEach(btn => {
    btn.addEventListener('click', e => {
      const key = e.currentTarget.dataset.key;
      const book = findBookByKey(key);
      if (book) openWhatsApp(buildSingleBookMessage(activeGrade.name, book, book.price));
    });
  });
}

function setupSearch() {
  const input = $('searchInput');
  const clearBtn = $('clearSearch');
  input.addEventListener('input', e => {
    currentSearch = e.target.value.trim();
    clearBtn.classList.toggle('hidden', !currentSearch);
    renderBooks();
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    currentSearch = '';
    clearBtn.classList.add('hidden');
    renderBooks();
  });
}

function setupSort() {
  $('sortSelect').addEventListener('change', e => {
    currentSort = e.target.value;
    renderBooks();
  });
}

function setupDelivery() {
  $('deliverySelect').addEventListener('change', updateSummary);
  $('orderSelectedBtn').addEventListener('click', orderSelected);
  $('floatOrderBtn').addEventListener('click', orderSelected);
}

function updateSummary() {
  const count = selectedBooks.size;
  const bar = $('floatingBar');
  if (count > 0) {
    bar.classList.remove('hidden');
    requestAnimationFrame(() => bar.classList.add('visible'));
    $('floatCount').textContent = count;
  } else {
    bar.classList.remove('visible');
    setTimeout(() => bar.classList.add('hidden'), 400);
  }

  $('summaryCount').textContent = count;
  let totalBooks = 0;
  selectedBooks.forEach(key => {
    const b = findBookByKey(key);
    if (b) totalBooks += b.price;
  });
  $('summaryBooks').textContent = formatPrice(totalBooks);

  const zoneId = $('deliverySelect').value;
  const dCost = getDeliveryCost(zoneId);
  if (dCost !== null && count > 0) {
    $('summaryDelivery').textContent = formatPrice(dCost);
    $('summaryTotal').textContent = formatPrice(totalBooks + dCost);
  } else {
    $('summaryDelivery').textContent = count > 0 ? 'اختر المنطقة' : '—';
    $('summaryTotal').textContent = '—';
  }

  $('orderSelectedBtn').disabled = count === 0;
}

function orderSelected() {
  if (!selectedBooks.size) {
    showToast('الرجاء تحديد مادة واحدة على الأقل');
    return;
  }
  const items = [];
  selectedBooks.forEach(key => {
    const b = findBookByKey(key);
    if (b) items.push({ name: b.name, pages: b.pages, price: b.price });
  });
  const totalBooks = items.reduce((s, b) => s + b.price, 0);
  const zoneId = $('deliverySelect').value;
  const dCost = getDeliveryCost(zoneId);
  const dName = getDeliveryName(zoneId);

  const msg = buildMultiBookMessage(
    activeGrade.name,
    items,
    totalBooks,
    zoneId ? { name: dName } : null,
    dCost,
    dCost !== null ? totalBooks + dCost : null
  );
  openWhatsApp(msg);
}

function showToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('visible');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => t.classList.remove('visible'), 2000);
}

init();
