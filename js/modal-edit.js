/**
 * modal-edit.js
 * Responsabilidad: abrir el modal de edición, rellenar los campos con
 * los datos actuales del cliente y guardar los cambios en Firestore.
 * Los campos de URL usan un selector combinado (lista guardada + entrada manual).
 */

import { db }                          from './firebase-config.js';
import { doc, updateDoc, Timestamp }   from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { toast }                       from './toast.js';
import { toInputDatetime }             from './table.js';
import { getCacheListas }              from './listas.js';

// ── Poblar selectores de URL desde listas ──────────────────────────
/**
 * Rellena un <select> con las listas guardadas + opción "manual".
 * Al seleccionar una opción del select, rellena el input de texto.
 * @param {string} selectId  id del <select>
 * @param {string} inputId   id del <input type="text">
 * @param {Array}  items     [{nombre, url}]
 * @param {string} valorActual URL ya guardada del cliente
 */
function poblarSelector(selectId, inputId, items, valorActual) {
  const sel   = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!sel || !input) return;

  sel.innerHTML = `<option value="">— Seleccionar lista guardada —</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value       = item.url;
    opt.textContent = item.nombre;
    if (item.url === valorActual) opt.selected = true;
    sel.appendChild(opt);
  });

  // Rellenar input al cambiar selector
  sel.onchange = () => {
    if (sel.value) input.value = sel.value;
  };

  // Valor actual en el input (puede no estar en las listas guardadas)
  input.value = valorActual || '';
}

// ── Abrir modal ────────────────────────────────────────────────────
export function abrirEdicion(id, usuarios) {
  const u = usuarios.find(x => x.id === id);
  if (!u) return;

  const listas = getCacheListas();

  document.getElementById('editId').value        = id;
  document.getElementById('editName').value      = u.name || '';
  document.getElementById('editRole').value      = u.role || '';
  document.getElementById('editStatus').value    = u.subscriptionStatus || 'active';
  document.getElementById('editPlan').value      = u.subscriptionPlan   || 'mensual';
  document.getElementById('editExpiry').value    = toInputDatetime(u.subscriptionExpiry);
  document.getElementById('editMaxConn').value   = u.maxConnections ?? 1;
  document.getElementById('editSession').value   = String(u.sessionActive !== false);
  document.getElementById('editBlockedAt').value = u.blockedAt
    ? new Date(u.blockedAt.toDate()).toLocaleString('es-CO')
    : '';

  // Poblar selectores con listas guardadas
  poblarSelector('editTvSel',    'editTv',    listas.canales,   u.m3uUrl   || '');
  poblarSelector('editMovieSel', 'editMovie', listas.peliculas, u.m3uMovie || '');
  poblarSelector('editSerieSel', 'editSerie', listas.series,    u.m3uSerie || '');

  document.getElementById('editModal').classList.add('open');
}

export function cerrarEdicion() {
  document.getElementById('editModal').classList.remove('open');
}

// ── Guardar cambios ────────────────────────────────────────────────
export async function guardarEdicion() {
  const id  = document.getElementById('editId').value;
  const btn = document.getElementById('saveEditBtn');
  btn.innerHTML = '<span class="loader"></span> Guardando...';
  btn.disabled  = true;

  try {
    const expiryStr = document.getElementById('editExpiry').value;
    const expiryTs  = expiryStr ? Timestamp.fromDate(new Date(expiryStr)) : null;

    const datos = {
      name:               document.getElementById('editName').value.trim(),
      role:               document.getElementById('editRole').value,
      subscriptionStatus: document.getElementById('editStatus').value,
      subscriptionPlan:   document.getElementById('editPlan').value,
      maxConnections:     parseInt(document.getElementById('editMaxConn').value) || 1,
      sessionActive:      document.getElementById('editSession').value === 'true',
      m3uUrl:             document.getElementById('editTv').value.trim(),
      m3uMovie:           document.getElementById('editMovie').value.trim(),
      m3uSerie:           document.getElementById('editSerie').value.trim(),
    };

    if (expiryTs) datos.subscriptionExpiry = expiryTs;

    await updateDoc(doc(db, 'users', id), datos);
    cerrarEdicion();
    toast('Cliente actualizado correctamente ✓', 'ok');
  } catch (e) {
    toast('Error al guardar: ' + e.message, 'err');
  } finally {
    btn.innerHTML = 'Guardar Cambios';
    btn.disabled  = false;
  }
}