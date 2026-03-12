/**
 * modal-create.js
 * Responsabilidad: crear cliente nuevo en Auth + Firestore,
 * o re-registrar en Firestore un usuario que ya existe en Auth.
 *
 * Modo "nuevo":     crea cuenta en Auth + documento Firestore.
 * Modo "existente": carga selector con usuarios de Auth via Flask,
 *                   al elegir email el UID se rellena solo,
 *                   solo crea el documento Firestore.
 */

import { db, authSecondary }               from './firebase-config.js';
import { createUserWithEmailAndPassword,
         signOut as signOutSecondary }      from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, Timestamp }          from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { toast }                           from './toast.js';
import { getCacheListas }                  from './listas.js';

// ── Helper fecha ───────────────────────────────────────────────────
function toInputDatetime(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` +
         `T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Poblar selectores de URL desde listas guardadas ────────────────
function poblarSelector(selectId, inputId, items) {
  const sel   = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  if (!sel || !input) return;
  sel.innerHTML = `<option value="">— Seleccionar lista guardada —</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value       = item.url;
    opt.textContent = item.nombre;
    sel.appendChild(opt);
  });
  sel.onchange = () => { if (sel.value) input.value = sel.value; };
}

// ── Cambiar modo ───────────────────────────────────────────────────
export function cambiarModo(modo) {
  const esNuevo  = modo === 'nuevo';
  const secNuevo = document.getElementById('create-section-nuevo');
  const secExist = document.getElementById('create-section-existente');
  const btnNuevo = document.getElementById('modoBtn-nuevo');
  const btnExist = document.getElementById('modoBtn-existente');

  secNuevo.style.display = esNuevo ? 'flex' : 'none';
  secExist.style.display = esNuevo ? 'none' : 'flex';
  btnNuevo.classList.toggle('active',  esNuevo);
  btnExist.classList.toggle('active', !esNuevo);

  // Limpiar campos al cambiar de modo
  if (esNuevo) {
    document.getElementById('existenteEmail').value    = '';
    document.getElementById('existentePassword').value = '';
  } else {
    document.getElementById('createEmail').value    = '';
    document.getElementById('createPassword').value = '';
    setTimeout(() => document.getElementById('existenteEmail')?.focus(), 100);
  }
}

// ── Abrir / cerrar modal ───────────────────────────────────────────
export function abrirCreacion() {
  document.getElementById('createForm').reset();

  document.getElementById('createStatus').value  = 'active';
  document.getElementById('createPlan').value    = 'mensual';
  document.getElementById('createMaxConn').value = '1';
  document.getElementById('createSession').value = 'true';
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  document.getElementById('createExpiry').value  = toInputDatetime(d);

  // Arrancar siempre en modo nuevo
  cambiarModo('nuevo');

  // Poblar selectores de listas M3U
  const listas = getCacheListas();
  poblarSelector('createTvSel',    'createTv',    listas.canales);
  poblarSelector('createMovieSel', 'createMovie', listas.peliculas);
  poblarSelector('createSerieSel', 'createSerie', listas.series);

  document.getElementById('createModal').classList.add('open');
  setTimeout(() => document.getElementById('createName')?.focus(), 100);
}

export function cerrarCreacion() {
  document.getElementById('createModal').classList.remove('open');
}

// ── Crear / restaurar cliente ──────────────────────────────────────
export async function crearCliente() {
  const btn  = document.getElementById('saveCreateBtn');
  const name = document.getElementById('createName').value.trim();
  const modoExistente = document.getElementById('modoBtn-existente')
                                .classList.contains('active');

  if (!name) {
    toast('El nombre es obligatorio.', 'warn');
    return;
  }

  btn.innerHTML = '<span class="loader"></span> Guardando...';
  btn.disabled  = true;

  try {
    let uid, email;

    if (modoExistente) {
      // ── MODO EXISTENTE ────────────────────────────────────────
      // Iniciamos sesión con la instancia secundaria para obtener
      // el UID sin cerrar la sesión del admin ni necesitar backend.
      email          = document.getElementById('existenteEmail').value.trim();
      const password = document.getElementById('existentePassword').value;

      if (!email || !password) {
        toast('Correo y contraseña del usuario existente son obligatorios.', 'warn');
        return;
      }

      const { signInWithEmailAndPassword } = await import(
        "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
      );
      const cred = await signInWithEmailAndPassword(authSecondary, email, password);
      uid = cred.user.uid;
      await signOutSecondary(authSecondary);

    } else {
      // ── MODO NUEVO ────────────────────────────────────────────
      email          = document.getElementById('createEmail').value.trim();
      const password = document.getElementById('createPassword').value;

      if (!email || !password) {
        toast('Correo y contraseña son obligatorios.', 'warn');
        return;
      }
      if (password.length < 6) {
        toast('La contraseña debe tener al menos 6 caracteres.', 'warn');
        return;
      }

      const cred = await createUserWithEmailAndPassword(authSecondary, email, password);
      uid = cred.user.uid;
      await signOutSecondary(authSecondary);
    }

    // ── Guardar documento en Firestore ────────────────────────
    const expiryStr = document.getElementById('createExpiry').value;
    const expiryTs  = expiryStr ? Timestamp.fromDate(new Date(expiryStr)) : null;

    const datos = {
      email,
      name,
      role:               document.getElementById('createRole').value || 'user',
      subscriptionStatus: document.getElementById('createStatus').value,
      subscriptionPlan:   document.getElementById('createPlan').value,
      maxConnections:     parseInt(document.getElementById('createMaxConn').value) || 1,
      sessionActive:      document.getElementById('createSession').value === 'true',
      m3uUrl:             document.getElementById('createTv').value.trim(),
      m3uMovie:           document.getElementById('createMovie').value.trim(),
      m3uSerie:           document.getElementById('createSerie').value.trim(),
      blockedAt:          null,
      registeredAt:       Timestamp.now(),
    };
    if (expiryTs) datos.subscriptionExpiry = expiryTs;

    await setDoc(doc(db, 'users', uid), datos);
    cerrarCreacion();
    toast(`Cliente "${name}" registrado con éxito ✓`, 'ok');

  } catch (e) {
    const msgs = {
      'auth/email-already-in-use':  'Ese correo ya existe en Authentication.',
      'auth/invalid-email':         'El correo no es válido.',
      'auth/weak-password':         'La contraseña es demasiado débil.',
      'auth/invalid-credential':    'Correo o contraseña incorrectos.',
      'auth/user-not-found':        'No existe ningún usuario con ese correo.',
      'auth/wrong-password':        'Contraseña incorrecta.',
    };
    toast(msgs[e.code] || 'Error: ' + e.message, 'err');
  } finally {
    btn.innerHTML = 'Guardar Cliente';
    btn.disabled  = false;
  }
}