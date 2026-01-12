import { auth, db, storage } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const btnSubir = document.getElementById("btnSubir");

btnSubir.addEventListener("click", async () => {
  if (!auth.currentUser) return alert("No autorizado");

  const nombre = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const imagen = document.getElementById("imagen").files[0];


  // Validaciones
  if (!nombre || !descripcion || !imagen || !precio) return alert("Completa todos los campos");
  if (isNaN(precio) || precio <= 0) return alert("Precio inválido");
  if (imagen.size > 2 * 1024 * 1024) return alert("La imagen no debe superar 2MB");

  try {
    // Subir imagen a Firebase Storage
    const imagePath = `pulseras/${Date.now()}_${imagen.name}`;
    const imgRef = ref(storage, imagePath);
    await uploadBytes(imgRef, imagen);
    const imagenURL = await getDownloadURL(imgRef);

    // Guardar pulsera en Firestore con createdAt automático
    await addDoc(collection(db, "pulseras"), {
      nombre,
      descripcion,
      precio: Number(precio.toFixed(2)),
      imagenURL,
      imagePath,
      createdAt: serverTimestamp(), // ← campo automático
      uid: auth.currentUser.uid
    });

    alert("Pulsera subida ✨");

    // Limpiar campos
    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("precio").value = "";
    document.getElementById("imagen").value = "";

  } catch (err) {
    console.error(err);
    alert("Error al subir la pulsera");
  }
});
