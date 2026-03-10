const statusEl = document.getElementById('status');
const bodyEl = document.getElementById('requests-body');
const emptyEl = document.getElementById('empty');
const formatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const STATUS_OPTIONS = [
  { value: 'new', label: 'новое', className: 'status-new' },
  { value: 'viewed', label: 'просмотрено', className: 'status-viewed' },
  { value: 'in_work', label: 'в работе', className: 'status-in-work' },
  { value: 'ready', label: 'готово', className: 'status-ready' },
];

const STATUS_CLASS_MAP = new Map(STATUS_OPTIONS.map((item) => [item.value, item.className]));
const LEGACY_STATUS_MAP = new Map([
  ['in_progress', 'in_work'],
  ['done', 'ready'],
  ['cancelled', 'new'],
]);

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return formatter.format(date);
}

function normalizeStatus(value) {
  if (!value) return 'new';
  if (STATUS_CLASS_MAP.has(value)) return value;
  return LEGACY_STATUS_MAP.get(value) || 'new';
}

function applySelectClass(select, statusValue) {
  for (const className of STATUS_CLASS_MAP.values()) {
    select.classList.remove(className);
  }
  const className = STATUS_CLASS_MAP.get(statusValue);
  if (className) {
    select.classList.add(className);
  }
}

async function updateStatus(id, status) {
  const response = await fetch(`/api/requests/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.message || `HTTP ${response.status}`;
    throw new Error(message);
  }
}

function createStatusSelect(row) {
  const select = document.createElement('select');
  select.className = 'status-select';

  for (const option of STATUS_OPTIONS) {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    select.appendChild(el);
  }

  const normalized = normalizeStatus(row.status);
  select.value = normalized;
  applySelectClass(select, normalized);

  select.addEventListener('change', async () => {
    const previous = normalizeStatus(row.status);
    const next = select.value;

    select.disabled = true;
    applySelectClass(select, next);

    try {
      await updateStatus(row.id, next);
      row.status = next;
    } catch (error) {
      console.error(error);
      select.value = normalizeStatus(previous);
      applySelectClass(select, normalizeStatus(previous));
      if (statusEl) {
        statusEl.textContent = 'Ошибка обновления статуса.';
      }
    } finally {
      select.disabled = false;
    }
  });

  return select;
}

function renderRows(rows) {
  bodyEl.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = row.id ?? '';

    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(row.created_at);

    const tdName = document.createElement('td');
    tdName.textContent = row.full_name ?? '';

    const tdEmail = document.createElement('td');
    tdEmail.className = 'cell-email';
    tdEmail.textContent = row.email ?? '';

    const tdAddress = document.createElement('td');
    tdAddress.className = 'cell-address';
    tdAddress.textContent = row.address ?? '';

    const tdDetails = document.createElement('td');
    tdDetails.className = 'cell-details';
    tdDetails.textContent = row.details ?? '';

    const tdStatus = document.createElement('td');
    tdStatus.appendChild(createStatusSelect(row));

    tr.appendChild(tdId);
    tr.appendChild(tdDate);
    tr.appendChild(tdName);
    tr.appendChild(tdEmail);
    tr.appendChild(tdAddress);
    tr.appendChild(tdDetails);
    tr.appendChild(tdStatus);
    bodyEl.appendChild(tr);
  }
}

async function loadRequests() {
  if (statusEl) {
    statusEl.textContent = 'Загрузка...';
  }
  try {
    const response = await fetch('/api/requests', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const rows = Array.isArray(payload.data) ? payload.data : [];
    renderRows(rows);
    emptyEl.hidden = rows.length > 0;
    if (statusEl) {
      statusEl.textContent = `Всего: ${rows.length}`;
    }
  } catch (error) {
    console.error(error);
    emptyEl.hidden = false;
    bodyEl.innerHTML = '';
    if (statusEl) {
      statusEl.textContent = 'Ошибка в загрузке заявок.';
    }
  }
}

loadRequests();
