/**
 * modal-delete.js
 * Responsabilidad: confirmar y ejecutar el borrado de un cliente.
 * El borrado elimina el documento de Firestore Y la cuenta de
 * Firebase Authentication usando la Admin SDK via una Cloud Function
 * — o, si no se tiene backend, solo elimina Firestore y notifica
 * que Auth debe borrarse manualmente desde la consola.
 *
 * NOTA: Firebase Client SDK no permite borrar otros usuarios desde
 * el navegador por seguridad. Aquí borramos el documento Firestore
 * y mostramos un aviso. Si tienes Cloud Functions puedes extenderlo.
 */

import { db }                   from './firebase-config.js';
import { doc, deleteDoc }       from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { toast }                from './toast.js';

const PALABRA_CLAVE = 'myconnect';

let _idPendiente   = null;
let _nombrePendiente = '';

// ── Abrir modal ────────────────────────────────────────────────────
/**
 * @param {string} id      UID del cliente en Firestore
 * @param {string} nombre  Nombre del cliente (para mostrar en el modal)
 */
export function abrirBorrado(id, nombre) {
  _idPendiente     = id;
  _nombrePendiente = nombre;

  // Limpiar campo de confirmación
  const input = document.getElementById('deleteConfirmInput');
  if (input) input.value = '';
  _actualizarBotonBorrar();

  // Actualizar el nombre en el modal
  const nameEl = document.getElementById('deleteClientName');
  if (nameEl) nameEl.textContent = nombre || 'este cliente';

  document.getElementById('deleteModal').classList.add('open');
  setTimeout(() => input?.focus(), 100);
}

export function cerrarBorrado() {
  _idPendiente     = null;
  _nombrePendiente = '';
  document.getElementById('deleteModal').classList.remove('open');
}

// ── Validación en tiempo real del campo ───────────────────────────
export function onDeleteInputChange() {
  _actualizarBotonBorrar();
}

function _actualizarBotonBorrar() {
  const val = (document.getElementById('deleteConfirmInput')?.value || '').toLowerCase();
  const btn = document.getElementById('confirmDeleteBtn');
  if (btn) btn.disabled = val !== PALABRA_CLAVE;
}

// ── Ejecutar borrado ───────────────────────────────────────────────
export async function confirmarBorrado() {
  if (!_idPendiente) return;

  const val = (document.getElementById('deleteConfirmInput')?.value || '').toLowerCase();
  if (val !== PALABRA_CLAVE) {
    toast(`Escribe "${PALABRA_CLAVE}" para confirmar.`, 'warn');
    return;
  }

  const btn = document.getElementById('confirmDeleteBtn');
  btn.innerHTML = '<span class="loader"></span> Borrando...';
  btn.disabled  = true;

  try {
    await deleteDoc(doc(db, 'users', _idPendiente));
    cerrarBorrado();
    toast(
      `Cliente "${_nombrePendiente}" eliminado de la base de datos. ` +
      `Recuerda borrarlo también en Firebase Authentication → usuarios.`,
      'warn'
    );
  } catch (e) {
    toast('Error al borrar: ' + e.message, 'err');
    btn.innerHTML = 'Confirmar borrado';
    btn.disabled  = false;
  }
}