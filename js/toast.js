/**
 * toast.js
 * Responsabilidad: mostrar notificaciones temporales (toast).
 * No conoce Firebase ni el DOM del panel; solo maneja #toast.
 */

let _timer = null;

/**
 * @param {string} msg   Mensaje a mostrar
 * @param {'ok'|'err'|'warn'} tipo Tipo visual
 */
export function toast(msg, tipo = 'ok') {
  const el = document.getElementById('toast');
  if (!el) return;

  const icon = {
    ok:   '<polyline points="20 6 9 17 4 12"/>',
    err:  '<path d="M18 6 6 18M6 6l12 12"/>',
    warn: '<path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>',
  }[tipo] || '';

  el.className = `show ${tipo}`;
  el.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2.5">${icon}</svg>
    ${msg}`;

  clearTimeout(_timer);
  _timer = setTimeout(() => { el.className = ''; }, 3400);
}