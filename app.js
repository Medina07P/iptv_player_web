import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Configuración de tu proyecto
const firebaseConfig = {
    apiKey: "AIzaSyCJuvziGDbhetVGKyLHuXmT-6-kK7DOaDc",
    authDomain: "iptv-player-70ac2.firebaseapp.com",
    projectId: "iptv-player-70ac2",
    storageBucket: "iptv-player-70ac2.firebasestorage.app",
    messagingSenderId: "707821425560",
    appId: "1:707821425560:web:6290a9e7a97cbc954cd1ed"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- LÓGICA DE AUTENTICACIÓN Y ROLES ---

window.login = async () => {
    const email = document.getElementById('adminEmail').value;
    const pass = document.getElementById('adminPass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        alert("Error de acceso: " + e.message);
    }
};

window.logout = () => signOut(auth);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verificar en Firestore si este usuario tiene role: "admin"
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-content').style.display = 'block';
            cargarUsuarios();
        } else {
            alert("Acceso denegado: No eres administrador.");
            await signOut(auth);
        }
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('admin-content').style.display = 'none';
    }
});

// --- GESTIÓN DE USUARIOS ---

function cargarUsuarios() {
    // Escuchar cambios en tiempo real de la colección "users"
    onSnapshot(collection(db, "users"), (snapshot) => {
        const list = document.getElementById('user-list');
        list.innerHTML = '';
        snapshot.forEach((docSnap) => {
            const user = docSnap.data();
            // Solo mostramos en la lista a los que no son admin (opcional)
            if (user.role !== 'admin') {
                list.innerHTML += `
                    <div class="user-card">
                        <div>
                            <strong>${user.name || 'Sin nombre'}</strong><br>
                            <small>${user.email}</small>
                        </div>
                        <button class="edit-btn" onclick="openEdit('${docSnap.id}', '${user.name || ''}', '${user.m3uUrl || ''}', '${user.m3uMovie || ''}', '${user.m3uSerie || ''}')">Editar</button>
                    </div>
                `;
            }
        });
    });
}

// --- FUNCIONES DEL MODAL (VENTANA EMERGENTE) ---

window.openEdit = (id, name, tv, movie, serie) => {
    document.getElementById('editId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editTv').value = tv;
    document.getElementById('editMovie').value = movie;
    document.getElementById('editSerie').value = serie;
    document.getElementById('editModal').style.display = 'block';
};

window.closeModal = () => {
    document.getElementById('editModal').style.display = 'none';
};

window.saveChanges = async () => {
    const id = document.getElementById('editId').value;
    const btn = document.querySelector('.save-btn');
    
    try {
        btn.innerText = "Guardando...";
        btn.disabled = true;

        await updateDoc(doc(db, "users", id), {
            name: document.getElementById('editName').value,
            m3uUrl: document.getElementById('editTv').value,
            m3uMovie: document.getElementById('editMovie').value,
            m3uSerie: document.getElementById('editSerie').value
        });

        closeModal();
        alert("¡Datos de MyConnect actualizados!");
    } catch (e) {
        alert("Error al guardar: " + e.message);
    } finally {
        btn.innerText = "Guardar Cambios";
        btn.disabled = false;
    }
};