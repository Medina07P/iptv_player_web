/**
 * auth.js
 * Responsabilidad: manejar autenticación del administrador.
 * Verifica que el usuario logueado tenga role === 'admin' en Firestore.
 * Expone las funciones login() y logout() al HTML mediante window.
 */

import { auth, db }                          from './firebase-config.js';
import { signInWithEmailAndPassword,
         signOut, onAuthStateChanged }        from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc }                       from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { toast }                             from './toast.js';

/**
 * @param {(user: import('firebase/auth').User) => void} onAdmin
 *   Callback que se llama cuando el usuario es admin verificado
 * @param {() => void} onSignedOut
 *   Callback cuando no hay sesión activa
 */
export function initAuth(onAdmin, onSignedOut) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { onSignedOut(); return; }

    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists() && snap.data().role === 'admin') {
      onAdmin(user);
    } else {
      toast('Acceso denegado: no eres administrador.', 'err');
      await signOut(auth);
    }
  });
}

/** Llama al login con email/password del formulario */
export async function login() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPass').value;
  const btn   = document.getElementById('loginBtn');

  btn.innerHTML = '<span class="loader"></span> Verificando...';
  btn.disabled  = true;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged se encarga del resto
  } catch {
    toast('Credenciales incorrectas.', 'err');
    btn.innerHTML = 'Acceder al Panel';
    btn.disabled  = false;
  }
}

/** Cierra sesión del administrador */
export async function logout(onCleanup) {
  if (onCleanup) onCleanup();
  await signOut(auth);
}