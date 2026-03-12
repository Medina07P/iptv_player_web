/**
 * listas.js
 * Responsabilidad: gestionar la colección `listas` en Firestore.
 * Cada documento tiene id = tipo ('canales' | 'peliculas' | 'series')
 * y un array `items: [{nombre, url}]`.
 *
 * No conoce la UI del dashboard; expone funciones puras que main.js consume.
 */

import { db }                              from './firebase-config.js';
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { toast }                           from './toast.js';

export const TIPOS = ['canales', 'peliculas', 'series'];

// Cache en memoria — se actualiza via onSnapshot
const _cache = { canales: [], peliculas: [], series: [] };

// ── Suscripción en tiempo real ─────────────────────────────────────
/**
 * Escucha los 3 documentos en tiempo real y llama al callback
 * con el cache actualizado cada vez que hay cambios.
 * @param {(cache: object) => void} onChange
 * @returns {Function} unsubscribe (llama para detener)
 */
export function suscribirListas(onChange) {
  const unsubs = TIPOS.map(tipo =>
    onSnapshot(doc(db, 'listas', tipo), snap => {
      _cache[tipo] = snap.exists() ? (snap.data().items || []) : [];
      onChange({ ..._cache });
    })
  );
  return () => unsubs.forEach(u => u());
}

/** Devuelve el cache actual (sin esperar Firestore) */
export function getCacheListas() {
  return { ..._cache };
}

// ── Guardar un ítem ────────────────────────────────────────────────
/**
 * Agrega una URL a la lista del tipo indicado.
 * @param {'canales'|'peliculas'|'series'} tipo
 * @param {string} nombre  Nombre descriptivo
 * @param {string} url     URL M3U
 */
export async function agregarLista(tipo, nombre, url) {
  if (!nombre.trim() || !url.trim()) {
    toast('Nombre y URL son obligatorios.', 'warn');
    return false;
  }
  if (!url.startsWith('http')) {
    toast('La URL debe comenzar con http.', 'warn');
    return false;
  }

  try {
    const ref      = doc(db, 'listas', tipo);
    const snap     = await getDoc(ref);
    const items    = snap.exists() ? (snap.data().items || []) : [];
    const nuevoId  = Date.now().toString();

    // Evitar URL duplicada en el mismo tipo
    if (items.some(i => i.url === url.trim())) {
      toast('Esa URL ya existe en esta lista.', 'warn');
      return false;
    }

    items.push({ id: nuevoId, nombre: nombre.trim(), url: url.trim() });
    await setDoc(ref, { items }, { merge: true });
    toast(`Lista "${nombre}" agregada ✓`, 'ok');
    return true;
  } catch (e) {
    toast('Error al guardar: ' + e.message, 'err');
    return false;
  }
}

// ── Eliminar un ítem ───────────────────────────────────────────────
/**
 * Elimina un ítem por su id del tipo indicado.
 * @param {'canales'|'peliculas'|'series'} tipo
 * @param {string} id
 */
export async function eliminarLista(tipo, id) {
  try {
    const ref   = doc(db, 'listas', tipo);
    const snap  = await getDoc(ref);
    if (!snap.exists()) return;

    const items = (snap.data().items || []).filter(i => i.id !== id);
    await setDoc(ref, { items }, { merge: true });
    toast('Lista eliminada.', 'ok');
  } catch (e) {
    toast('Error al eliminar: ' + e.message, 'err');
  }
}