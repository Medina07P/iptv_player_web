/**
 * main.js
 * Responsabilidad: orquestar todos los módulos. No contiene lógica
 * de negocio; conecta autenticación, datos en tiempo real, tabla,
 * stats, modales de edición/creación/borrado y gestión de listas.
 */

import { db }                                  from './firebase-config.js';
import { initAuth, login, logout }              from './auth.js';
import { actualizarStats }                     from './stats.js';
import { renderTabla, filtrarTabla }           from './table.js';
import { abrirEdicion, cerrarEdicion,
         guardarEdicion }                      from './modal-edit.js';
import { abrirCreacion, cerrarCreacion,
         crearCliente, cambiarModo }        from './modal-create.js';
import { abrirBorrado, cerrarBorrado,
         confirmarBorrado,
         onDeleteInputChange }                 from './modal-delete.js';
import { suscribirListas, agregarLista,
         eliminarLista, TIPOS }                from './listas.js';
import { toast }                               from './toast.js';
import { collection, onSnapshot }             from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ── Estado global ──────────────────────────────────────────────────
let todosLosUsuarios      = [];
let unsubscribeFirestore  = null;
let unsubscribeListas     = null;

// ── Init ───────────────────────────────────────────────────────────
initAuth(
  (user) => {
    mostrarDashboard(user);
    suscribirUsuarios();
    iniciarListas();
  },
  () => mostrarLogin()
);

// ── Visibilidad ────────────────────────────────────────────────────
function mostrarDashboard(user) {
  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('dashboard').style.display     = 'block';
  document.getElementById('adminEmailLabel').textContent  = user.email;
}
function mostrarLogin() {
  document.getElementById('login-screen').style.display  = 'flex';
  document.getElementById('dashboard').style.display     = 'none';
  const btn = document.getElementById('loginBtn');
  if (btn) { btn.innerHTML = 'Acceder al Panel'; btn.disabled = false; }
}

// ── Usuarios en tiempo real ────────────────────────────────────────
function suscribirUsuarios() {
  if (unsubscribeFirestore) unsubscribeFirestore();
  unsubscribeFirestore = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      todosLosUsuarios = [];
      snapshot.forEach(d => {
        if (d.data().role !== 'admin') {
          todosLosUsuarios.push({ id: d.id, ...d.data() });
        }
      });
      actualizarStats(todosLosUsuarios);
      renderTabla(todosLosUsuarios, _onEdit, _onDelete);
    },
    (err) => toast('Error al cargar usuarios: ' + err.message, 'err')
  );
}

// ── Listas en tiempo real ──────────────────────────────────────────
function iniciarListas() {
  if (unsubscribeListas) unsubscribeListas();
  unsubscribeListas = suscribirListas((cache) => {
    TIPOS.forEach(tipo => renderListaSection(tipo, cache[tipo]));
  });
}

// ── Renderizar sección de listas ───────────────────────────────────
function renderListaSection(tipo, items) {
  const container = document.getElementById(`lista-items-${tipo}`);
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `<p class="lista-empty">Sin listas guardadas.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="lista-item">
      <div class="lista-item-info">
        <span class="lista-item-name">${item.nombre}</span>
        <span class="lista-item-url">${item.url}</span>
      </div>
      <button class="btn btn-danger btn-sm lista-del-btn"
              data-tipo="${tipo}" data-id="${item.id}" title="Eliminar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.lista-del-btn').forEach(btn => {
    btn.addEventListener('click', () =>
      eliminarLista(btn.dataset.tipo, btn.dataset.id)
    );
  });
}

// ── Agregar lista desde formulario ─────────────────────────────────
async function _agregarListaForm(tipo) {
  const nombre = document.getElementById(`lista-nombre-${tipo}`).value;
  const url    = document.getElementById(`lista-url-${tipo}`).value;
  const ok     = await agregarLista(tipo, nombre, url);
  if (ok) {
    document.getElementById(`lista-nombre-${tipo}`).value = '';
    document.getElementById(`lista-url-${tipo}`).value    = '';
  }
}

// ── Callbacks internos ─────────────────────────────────────────────
function _onEdit(id) {
  abrirEdicion(id, todosLosUsuarios);
}
function _onDelete(id, nombre) {
  abrirBorrado(id, nombre);
}

// ── Exponer al HTML ────────────────────────────────────────────────
window.login              = login;
window.logout             = () => {
  if (unsubscribeFirestore) unsubscribeFirestore();
  if (unsubscribeListas)    unsubscribeListas();
  logout();
};
window.filtrarTabla       = () => filtrarTabla(todosLosUsuarios, _onEdit, _onDelete);
window.recargar           = () => toast('Lista actualizada en tiempo real ↻', 'ok');

// Modal editar
window.cerrarEdicion      = cerrarEdicion;
window.guardarEdicion     = guardarEdicion;

// Modal crear
window.abrirCreacion      = abrirCreacion;
window.cerrarCreacion        = cerrarCreacion;
window.crearCliente          = crearCliente;
window.cambiarModo           = cambiarModo;

// Modal borrar
window.cerrarBorrado      = cerrarBorrado;
window.confirmarBorrado   = confirmarBorrado;
window.onDeleteInputChange = onDeleteInputChange;

// Sección listas — exponer función por tipo
window.agregarListaForm   = _agregarListaForm;