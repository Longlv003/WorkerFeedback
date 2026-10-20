'use strict';
const API = '/api/survey';
const $ = id => document.getElementById(id);
let token = '';
let allSubmissions = [];
let questions = [];
let loading = false;
let session = 0;
let hasLoaded = false;
let exporting = false;
const filterIds = ['search-input', 'department-filter', 'location-filter', 'date-from', 'date-to'];

$('login-form').addEventListener('submit', doLogin);
$('logout-btn').addEventListener('click', doLogout);
$('reload-btn').addEventListener('click', loadAll);
$('export-btn').addEventListener('click', exportExcel);
filterIds.forEach(id => $(id).addEventListener('input', filterTable));
$('clear-filters').addEventListener('click', () => {
  filterIds.forEach(id => { $(id).value = ''; });
  filterTable();
});

async function doLogin(event) {
  event.preventDefault();
  $('login-error').hidden = true;
  $('login-btn').disabled = true;
  try {
    const res = await fetch(`${API}/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('password-input').value })
    });
    const data = await res.json();
    if (!res.ok || !data.success || !data.token) throw new Error(data.message || 'Không thể đăng nhập.');
    token = data.token;
    session++;
    $('password-input').value = '';
    $('login-screen').hidden = true;
    $('app-shell').hidden = false;
    await loadAll();
  } catch (err) {
    $('login-error').textContent = err.message || 'Không thể kết nối đến máy chủ.';
    $('login-error').hidden = false;
  } finally { $('login-btn').disabled = false; }
}

function doLogout() {
  session++;
  token = '';
  allSubmissions = [];
  questions = [];
  loading = false;
  hasLoaded = false;
  exporting = false;
  $('export-btn').disabled = false;
  $('export-btn').textContent = 'Xuất Excel';
  $('export-status').hidden = true;
  $('results-head').replaceChildren();
  $('results-body').replaceChildren();
  $('total-count').textContent = '—';
  $('last-updated').textContent = 'Chưa tải dữ liệu';
  $('filtered-count').textContent = 'Đang tải...';
  $('data-error').hidden = true;
  filterIds.forEach(id => { $(id).value = ''; });
  $('app-shell').hidden = true;
  $('login-screen').hidden = false;
  $('password-input').focus();
}

async function request(path, authToken) {
  const res = await fetch(`${API}${path}`, {
    cache: 'no-store', headers: { Authorization: `Bearer ${authToken}` }
  });
  if (res.status === 401) {
    const error = new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    error.unauthorized = true;
    throw error;
  }
  if (!res.ok) throw new Error('Không tải được dữ liệu. Vui lòng thử lại.');
  return res.json();
}

async function exportExcel() {
  if (exporting || !token) return;
  const currentSession = session;
  exporting = true;
  $('export-btn').disabled = true;
  $('export-btn').textContent = 'Đang xuất...';
  $('export-status').hidden = true;
  try {
    const res = await fetch(`${API}/admin/export`, {
      cache: 'no-store', headers: { Authorization: `Bearer ${token}` }
    });
    if (currentSession !== session) return;
    if (res.status === 401) {
      doLogout();
      $('login-error').textContent = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      $('login-error').hidden = false;
      return;
    }
    if (!res.ok) throw new Error('Không thể xuất Excel. Vui lòng thử lại.');
    const blob = await res.blob();
    if (currentSession !== session) return;
    const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'KhaoSat.xlsx';
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('export-status').className = 'export-status';
    $('export-status').textContent = 'Đã tạo tệp Excel chứa toàn bộ dữ liệu mới nhất (không áp dụng bộ lọc trên bảng).';
    $('export-status').hidden = false;
  } catch (err) {
    if (currentSession !== session) return;
    $('export-status').className = 'error';
    $('export-status').textContent = err.message || 'Không thể xuất Excel. Vui lòng thử lại.';
    $('export-status').hidden = false;
  } finally {
    if (currentSession === session) {
      exporting = false;
      $('export-btn').disabled = false;
      $('export-btn').textContent = 'Xuất Excel';
    }
  }
}

async function loadAll() {
  if (loading || !token) return;
  const currentSession = session;
  loading = true;
  $('reload-btn').disabled = true;
  $('reload-btn').textContent = 'Đang tải dữ liệu...';
  $('data-error').hidden = true;
  try {
    const [config, submissions] = await Promise.all([
      request('/config', token), request('/admin/submissions', token)
    ]);
    if (currentSession !== session) return;
    if (!Array.isArray(config.survey?.questions) || !submissions.success || !Array.isArray(submissions.data)) {
      throw new Error('Dữ liệu máy chủ trả về không hợp lệ.');
    }
    const nextQuestions = [];
    const seen = new Set();
    function flatten(items) {
      for (const q of items) {
        if (!seen.has(q.id)) { seen.add(q.id); nextQuestions.push(q); }
        for (const rule of q.conditionalQuestions || []) flatten([rule.question]);
      }
    }
    flatten(config.survey.questions);
    // Retain columns for answers from older survey versions as well.
    for (const row of submissions.data) {
      for (const id of Object.keys(row.answers || {})) {
        if (!seen.has(id)) { seen.add(id); nextQuestions.push({ id, text: id }); }
      }
    }
    questions = nextQuestions;
    allSubmissions = submissions.data;
    hasLoaded = true;
    populateSelect('department-filter', 'Tất cả bộ phận', 'department');
    populateSelect('location-filter', 'Tất cả vị trí', 'work_location');
    $('total-count').textContent = allSubmissions.length.toLocaleString('vi-VN');
    $('last-updated').textContent = `Cập nhật lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`;
    renderHeader();
    filterTable();
  } catch (err) {
    if (currentSession !== session) return;
    if (err.unauthorized) {
      doLogout();
      $('login-error').textContent = err.message;
      $('login-error').hidden = false;
      return;
    }
    $('data-error').textContent = `${err.message || 'Không thể kết nối đến máy chủ.'} ${hasLoaded ? 'Bảng vẫn hiển thị dữ liệu từ lần tải thành công trước.' : 'Chưa có dữ liệu để hiển thị.'}`;
    $('data-error').hidden = false;
    if (!hasLoaded) $('filtered-count').textContent = 'Tải dữ liệu thất bại';
  } finally {
    if (currentSession === session) {
      loading = false;
      $('reload-btn').disabled = false;
      $('reload-btn').textContent = '↻ Tải lại dữ liệu';
    }
  }
}

function populateSelect(id, placeholder, field) {
  const select = $(id);
  const previous = select.value;
  const values = [...new Set(allSubmissions.map(row => row[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi'));
  // Keep a selected filter even when a refresh returns no matching records.
  if (previous && !values.includes(previous)) values.push(previous);
  select.replaceChildren(new Option(placeholder, ''), ...values.map(value => new Option(value, value)));
  select.value = previous;
}

function renderHeader() {
  const row = document.createElement('tr');
  const headers = ['STT', 'ID', 'Tên', ...questions.map(q => `[${q.id}] ${q.text}`), 'Bộ phận / Phòng ban', 'Vị trí làm việc', 'Ngày gửi'];
  headers.forEach((text, index) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = text;
    if (index >= 3 && index < 3 + questions.length) th.className = 'question';
    row.append(th);
  });
  $('results-head').replaceChildren(row);
}

// Existing records use vi-VN strings; new records use ISO timestamps.
function dateKey(value) {
  const text = String(value || '');
  const legacy = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (legacy) return `${legacy[3]}-${legacy[2].padStart(2, '0')}-${legacy[1].padStart(2, '0')}`;
  if (!/^\d{4}-\d{2}-\d{2}/.test(text)) return '';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function displayDate(value) {
  if (!value) return '—';
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function filterTable() {
  if (!hasLoaded) return;
  const query = $('search-input').value.trim().toLocaleLowerCase('vi');
  const dept = $('department-filter').value;
  const location = $('location-filter').value;
  const from = $('date-from').value;
  const to = $('date-to').value;
  const invalidRange = from && to && from > to;
  const filtered = invalidRange ? [] : allSubmissions.filter(row => {
    const day = dateKey(row.submitted_at);
    return (!query || [row.worker_id, row.worker_name].some(value => String(value || '').toLocaleLowerCase('vi').includes(query))) &&
      (!dept || row.department === dept) && (!location || row.work_location === location) &&
      (!from || (day && day >= from)) && (!to || (day && day <= to));
  });
  $('filtered-count').textContent = invalidRange ? 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.' : `Hiển thị ${filtered.length.toLocaleString('vi-VN')} / ${allSubmissions.length.toLocaleString('vi-VN')} lượt tham gia`;
  renderRows(filtered, invalidRange ? 'Vui lòng chọn lại khoảng ngày.' : allSubmissions.length ? 'Không có kết quả phù hợp với bộ lọc.' : 'Chưa có lượt tham gia nào.');
}

function answerText(question, value) {
  if (value === undefined || value === null || value === '') return '—';
  const label = v => question.options?.find(option => option.value === v)?.label || String(v);
  return Array.isArray(value) ? value.map(label).join(', ') : label(value);
}

function renderRows(rows, emptyMessage) {
  const fragment = document.createDocumentFragment();
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    const values = [index + 1, row.worker_id, row.worker_name, ...questions.map(q => answerText(q, row.answers?.[q.id])), row.department, row.work_location, displayDate(row.submitted_at)];
    values.forEach((value, col) => {
      const td = document.createElement('td');
      td.textContent = value === undefined || value === null || value === '' ? '—' : String(value);
      if (col >= 3 && col < 3 + questions.length) td.className = 'answer';
      tr.append(td);
    });
    fragment.append(tr);
  });
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = questions.length + 6;
    td.className = 'empty';
    td.textContent = emptyMessage;
    tr.append(td);
    fragment.append(tr);
  }
  $('results-body').replaceChildren(fragment);
}
