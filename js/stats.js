/**
 * stats.js
 * Responsabilidad: calcular y renderizar los contadores del dashboard.
 * No habla con Firebase directamente; recibe el array de usuarios ya cargado.
 */

/**
 * Actualiza los 4 contadores en el DOM.
 * @param {Array} usuarios Lista completa de clientes (sin admins)
 */
export function actualizarStats(usuarios) {
  const activos  = usuarios.filter(u => u.subscriptionStatus === 'active').length;
  const pending  = usuarios.filter(u => u.subscriptionStatus === 'pending').length;
  const expired  = usuarios.filter(u =>
    u.subscriptionStatus === 'expired' || u.subscriptionStatus === 'cancelled'
  ).length;

  setText('stat-active',  activos);
  setText('stat-pending', pending);
  setText('stat-expired', expired);
  setText('stat-total',   usuarios.length);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}