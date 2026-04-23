interface RequestRow {
  id: string | number;
  created_at: string | number | Date;
  full_name: string;
  email: string;
  address: string;
  details: string;
  status: string;
}

interface StatusOption {
  value: string;
  label: string;
  className: string;
}

interface ApiResponse {
  data?: RequestRow[];
  message?: string;
  isAuthenticated?: boolean;
  [key: string]: unknown;
}

const authSectionEl = document.getElementById('admin-auth') as HTMLElement | null;
const authFormEl = document.getElementById('admin-login-form') as HTMLFormElement | null;
const authStatusEl = document.getElementById('admin-auth-status') as HTMLElement | null;
const panelEl = document.getElementById('admin-panel') as HTMLElement | null;
const statusEl = document.getElementById('status') as HTMLElement | null;
const bodyEl = document.getElementById('requests-body') as HTMLTableSectionElement | null;
const emptyEl = document.getElementById('empty') as HTMLElement | null;

const formatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const STATUS_OPTIONS: readonly StatusOption[] = [
  { value: 'new', label: 'новое', className: 'status-new' },
  { value: 'viewed', label: 'просмотрено', className: 'status-viewed' },
  { value: 'in_work', label: 'в работе', className: 'status-in-work' },
  { value: 'ready', label: 'готово', className: 'status-ready' },
];

const STATUS_CLASS_MAP = new Map<string, string>(
  STATUS_OPTIONS.map((item): [string, string] => [item.value, item.className])
);

const LEGACY_STATUS_MAP = new Map<string, string>([
  ['in_progress', 'in_work'],
  ['done', 'ready'],
  ['cancelled', 'new'],
]);

function setAuthStatus(message: string): void {
  if (authStatusEl) {
    authStatusEl.textContent = message;
  }
}

function showAdminPanel(): void {
  if (authSectionEl) {
    authSectionEl.hidden = true;
  }

  if (panelEl) {
    panelEl.hidden = false;
  }
}

function showAuthForm(): void {
  if (authSectionEl) {
    authSectionEl.hidden = false;
  }

  if (panelEl) {
    panelEl.hidden = true;
  }
}

function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return formatter.format(date);
}

function normalizeStatus(value: string | null | undefined): string {
  if (!value) return 'new';
  if (STATUS_CLASS_MAP.has(value)) return value;
  const legacy = LEGACY_STATUS_MAP.get(value);
  return legacy ?? 'new';
}

function applySelectClass(select: HTMLSelectElement, statusValue: string): void {
  for (const className of STATUS_CLASS_MAP.values()) {
    select.classList.remove(className);
  }

  const className = STATUS_CLASS_MAP.get(statusValue);
  if (className) {
    select.classList.add(className);
  }
}

async function updateStatus(id: string | number, status: string): Promise<void> {
  const response = await fetch(`/api/requests/${String(id)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const payload: ApiResponse = await response.json().catch((): ApiResponse => ({}));
    const message = payload.message || `HTTP ${response.status}`;
    throw new Error(String(message));
  }
}

function createStatusSelect(row: RequestRow): HTMLSelectElement {
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

  select.addEventListener('change', async (event: Event): Promise<void> => {
    const target = event.target as HTMLSelectElement | null;
    if (!target) return;

    const previous = normalizeStatus(row.status);
    const next = target.value;

    target.disabled = true;
    applySelectClass(target, next);

    try {
      await updateStatus(row.id, next);
      row.status = next;
    } catch (error: unknown) {
      console.error(error);
      target.value = previous;
      applySelectClass(target, previous);
      if (statusEl) {
        statusEl.textContent = 'Ошибка обновления статуса.';
      }
    } finally {
      target.disabled = false;
    }
  });

  return select;
}

function renderRows(rows: readonly RequestRow[]): void {
  if (!bodyEl) return;

  bodyEl.innerHTML = '';

  for (const row of rows) {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = String(row.id ?? '');

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

async function loadRequests(): Promise<void> {
  if (statusEl) {
    statusEl.textContent = 'Загрузка...';
  }

  try {
    const response = await fetch('/api/requests', { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload: ApiResponse = await response.json();
    const rows: RequestRow[] = Array.isArray(payload.data) ? payload.data : [];

    renderRows(rows);

    if (emptyEl) {
      emptyEl.hidden = rows.length > 0;
    }

    if (statusEl) {
      statusEl.textContent = `Всего: ${rows.length}`;
    }
  } catch (error: unknown) {
    console.error(error);

    if (emptyEl) {
      emptyEl.hidden = false;
    }
    if (bodyEl) {
      bodyEl.innerHTML = '';
    }
    if (statusEl) {
      statusEl.textContent = 'Ошибка загрузки заявок.';
    }
  }
}

async function checkSession(): Promise<boolean> {
  try {
    const response = await fetch('/api/session', { cache: 'no-store' });
    if (!response.ok) {
      return false;
    }

    const payload: ApiResponse = await response.json();
    return Boolean(payload.isAuthenticated);
  } catch (error: unknown) {
    console.error(error);
    return false;
  }
}

async function login(username: string, password: string): Promise<boolean> {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  return response.ok;
}

if (authFormEl) {
  authFormEl.addEventListener('submit', async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();

    const username = (authFormEl.elements.namedItem('username') as HTMLInputElement | null)?.value.trim() || '';
    const password = (authFormEl.elements.namedItem('password') as HTMLInputElement | null)?.value.trim() || '';

    if (!username || !password) {
      setAuthStatus('Введите логин и пароль.');
      return;
    }

    setAuthStatus('Проверяем данные...');

    try {
      const ok = await login(username, password);
      if (!ok) {
        setAuthStatus('Неверный логин или пароль.');
        return;
      }

      showAdminPanel();
      setAuthStatus('');
      await loadRequests();
    } catch (error: unknown) {
      console.error(error);
      setAuthStatus('Не удалось выполнить вход.');
    }
  });
}

void (async () => {
  const isAuthenticated = await checkSession();

  if (isAuthenticated) {
    showAdminPanel();
    await loadRequests();
    return;
  }

  showAuthForm();
})();
