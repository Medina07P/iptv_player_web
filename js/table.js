/**
 * table.js
 * Responsabilidad: renderizar la tabla de clientes, badges,
 * búsqueda y botones de acción (editar / borrar).
 */

// ── Helpers de formato ─────────────────────────────────────────────

export function formatFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export function toInputDatetime(ts) {
  if (!ts) return '';
  const d   = ts.toDate ? ts.toDate() : new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function statusBadge(s) {
  const map = {
    active:    ['badge-active',    'Activo'],
    expired:   ['badge-expired',   'Vencido'],
    pending:   ['badge-pending',   'Pendiente'],
    cancelled: ['badge-cancelled', 'Cancelado'],
  };
  const [cls, label] = map[s] || ['badge-cancelled', s || '—'];
  return `<span class="badge ${cls}">
            <span class="badge-dot" style="background:currentColor"></span>
            ${label}
          </span>`;
}

export function planBadge(p) {
  const map = {
    mensual:    'badge-mensual',
    trimestral: 'badge-trimestral',
    anual:      'badge-anual',
    vip:        'badge-vip',
  };
  return `<span class="badge ${map[p] || 'badge-cancelled'}">${p || '—'}</span>`;
}

// ── Renderizado ────────────────────────────────────────────────────

/**
 * @param {Array}    lista     Usuarios a mostrar
 * @param {Function} onEdit    Callback al editar   (id)
 * @param {Function} onDelete  Callback al borrar   (id, nombre)
 */
export function renderTabla(lista, onEdit, onDelete) {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="8">Sin clientes registrados</td>
      </tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => `
    <tr data-id="${u.id}">
      <td>
        <div class="td-name">${u.name || '—'}</div>
        <div class="td-email">${u.email || ''}</div>
      </td>
      <td>${statusBadge(u.subscriptionStatus)}</td>
      <td>${planBadge(u.subscriptionPlan)}</td>
      <td class="td-mono">${formatFecha(u.subscriptionExpiry)}</td>
      <td>
        <span class="badge ${u.sessionActive !== false ? 'badge-active' : 'badge-expired'}">
          ${u.sessionActive !== false ? 'Activa' : 'Bloqueada'}
        </span>
      </td>
      <td class="td-mono">${u.maxConnections ?? 1}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm edit-btn" data-id="${u.id}">
            Editar
          </button>
          <button class="btn btn-danger btn-sm delete-btn"
                  data-id="${u.id}" data-name="${(u.name||'').replace(/"/g,'&quot;')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Delegación de eventos
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); onEdit(btn.dataset.id); });
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onDelete(btn.dataset.id, btn.dataset.name);
    });
  });
  tbody.querySelectorAll('tr[data-id]').forEach(row => {
    row.addEventListener('click', () => onEdit(row.dataset.id));
  });
}

// ── Filtro ────────────────────────────────────────────────────────

export function filtrarTabla(todos, onEdit, onDelete) {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const filtrado = todos.filter(u =>
    (u.name  || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  );
  renderTabla(filtrado, onEdit, onDelete);
}