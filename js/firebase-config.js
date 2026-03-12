/**
 * firebase-config.js
 * Responsabilidad: inicializar Firebase y exportar las instancias
 * necesarias. Ningún otro archivo llama a initializeApp.
 *
 * Se crean DOS instancias de la app:
 *  - `app`          → instancia principal (admin logueado)
 *  - `secondaryApp` → instancia secundaria para crear usuarios
 *    sin cerrar la sesión del admin (createUserWithEmailAndPassword
 *    loguea automáticamente al nuevo usuario si se usa la misma app).
 */

import { initializeApp }    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }     from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth }          from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCJuvziGDbhetVGKyLHuXmT-6-kK7DOaDc",
  authDomain:        "iptv-player-70ac2.firebaseapp.com",
  projectId:         "iptv-player-70ac2",
  storageBucket:     "iptv-player-70ac2.firebasestorage.app",
  messagingSenderId: "707821425560",
  appId:             "1:707821425560:web:6290a9e7a97cbc954cd1ed",
};

// Instancia principal — admin
const app  = initializeApp(firebaseConfig, 'primary');
export const db   = getFirestore(app);
export const auth = getAuth(app);

// Instancia secundaria — solo para registrar nuevos usuarios
// Se usa en modal-create.js para que el admin no pierda su sesión
const secondaryApp  = initializeApp(firebaseConfig, 'secondary');
export const authSecondary = getAuth(secondaryApp);