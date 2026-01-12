import { db, storage, auth } from "./firebase-config.js";
import { collection, query, orderBy, limit, startAfter, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, deleteObject, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export function initGallery(containerId, isAdmin = false) {
  const galleryContainer = document.getElementById(containerId);
  if (!galleryContainer) return;

  // ---------------- LIGHTBOX ----------------
  let lightbox = document.getElementById("lightbox");
  let lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className = "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden z-50";
    lightbox.innerHTML = `<img id="lightbox-img" class="max-h-full max-w-full rounded-xl shadow-2xl">`;
    document.body.appendChild(lightbox);
    lightboxImg = document.getElementById("lightbox-img");
    lightbox.addEventListener("click", () => lightbox.classList.add("hidden"));
  }

  // ---------------- PAGINACIÓN ----------------
  const pageSize = 5;
  let lastVisible = null;
  let isFetching = false;

  // Botón "Cargar más"
  let loadMoreBtn = document.getElementById("loadMoreAdmin");
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "loadMoreAdmin";
    loadMoreBtn.className = "btn btn-pink-gradient w-100 py-2 rounded-full text-white shadow-md my-4";
    loadMoreBtn.textContent = "Cargar más 💖";
    galleryContainer.parentElement.appendChild(loadMoreBtn);
  }

  const cargarPulseras = async () => {
    if (isFetching) return;
    isFetching = true;

    let q = query(collection(db, "pulseras"), orderBy("createdAt", "desc"), limit(pageSize));
    if (lastVisible) q = query(collection(db, "pulseras"), orderBy("createdAt", "desc"), startAfter(lastVisible), limit(pageSize));

    const snapshot = await getDocs(q);
    if (!snapshot.empty) lastVisible = snapshot.docs[snapshot.docs.length - 1];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      const precioForm = Number(data.precio).toFixed(2);

      const card = document.createElement("div");
      card.className = "col-md-6 col-lg-4 mb-4";

      card.innerHTML = `
        <div class="card shadow-lg rounded-4 border-0 h-100 position-relative">
          <img src="${data.imagenURL}" class="card-img-top rounded-top-4 cursor-pointer" alt="${data.nombre}" style="height:180px; object-fit:cover;">
          <div class="card-body text-center">
            <h6 class="fw-bold text-pink-600 mb-1">${data.nombre}</h6>
            <p class="text-muted small mb-1">${data.descripcion}</p>
            <p class="fs-6 fw-bold text-rose-500 mb-2">$${precioForm}</p>
            ${isAdmin ? `
              <button class="btn btn-sm btn-outline-primary me-1 btn-edit">Editar</button>
              <button class="btn btn-sm btn-outline-danger btn-delete">Eliminar</button>
            ` : ""}
          </div>

          ${isAdmin ? `
            <div class="edit-panel position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-95 p-3 d-none rounded-4" style="z-index:10;">
              <h6 class="fw-bold text-pink-600 mb-2">Editar Pulsera</h6>
              <input type="text" class="form-control mb-2 edit-nombre" placeholder="Nombre" value="${data.nombre}">
              <textarea class="form-control mb-2 edit-descripcion" rows="2" placeholder="Descripción">${data.descripcion}</textarea>
              <input type="number" class="form-control mb-2 edit-precio" placeholder="Precio" step="0.01" min="0" value="${data.precio}">
              <input type="file" class="form-control mb-2 edit-imagen" accept="image/jpeg,image/png">
              <div class="text-end">
                <button class="btn btn-sm btn-success btn-save me-1">Guardar</button>
                <button class="btn btn-sm btn-secondary btn-cancel">Cancelar</button>
              </div>
            </div>
          ` : ""}
        </div>
      `;

      // ---------------- LIGHTBOX ----------------
      card.querySelector("img").addEventListener("click", () => {
        lightboxImg.src = data.imagenURL;
        lightbox.classList.remove("hidden");
      });

      // ---------------- ADMIN FUNCIONES ----------------
      if (isAdmin) {
        const editPanel = card.querySelector(".edit-panel");

        card.querySelector(".btn-delete").addEventListener("click", async () => {
          if (!auth.currentUser) return alert("No autorizado");
          if (!confirm("¿Seguro que quieres eliminar esta pulsera?")) return;

          try {
            const imgRef = ref(storage, data.imagePath);
            await deleteObject(imgRef);
            await deleteDoc(doc(db, "pulseras", id));
            alert("Pulsera eliminada ✨");
            card.remove(); // Eliminar visualmente
          } catch (err) {
            console.error(err);
            alert("Error al eliminar");
          }
        });

        card.querySelector(".btn-edit").addEventListener("click", () => editPanel.classList.remove("d-none"));
        card.querySelector(".btn-cancel").addEventListener("click", () => editPanel.classList.add("d-none"));

        card.querySelector(".btn-save").addEventListener("click", async () => {
          const nuevoNombre = card.querySelector(".edit-nombre").value.trim();
          const nuevaDescripcion = card.querySelector(".edit-descripcion").value.trim();
          const nuevoPrecio = parseFloat(card.querySelector(".edit-precio").value);

          if (!nuevoNombre || !nuevaDescripcion || isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
            return alert("Datos inválidos");
          }

          const actualizar = {
            nombre: nuevoNombre,
            descripcion: nuevaDescripcion,
            precio: Number(nuevoPrecio.toFixed(2))
          };

          const inputFile = card.querySelector(".edit-imagen");
          if (inputFile.files.length > 0) {
            const nuevaImg = inputFile.files[0];
            if (nuevaImg.size > 2 * 1024 * 1024) return alert("La imagen no debe superar 2MB");

            try {
              const newPath = `pulseras/${Date.now()}_${nuevaImg.name}`;
              const newRef = ref(storage, newPath);
              await uploadBytes(newRef, nuevaImg);
              const newURL = await getDownloadURL(newRef);

              const oldRef = ref(storage, data.imagePath);
              await deleteObject(oldRef);

              actualizar.imagenURL = newURL;
              actualizar.imagePath = newPath;
            } catch (err) {
              console.error(err);
              return alert("Error al actualizar imagen");
            }
          }

          try {
            await updateDoc(doc(db, "pulseras", id), actualizar);
            alert("Pulsera actualizada ✨");
            editPanel.classList.add("d-none");
            // Actualizar visualmente
            card.querySelector("h6").textContent = actualizar.nombre;
            card.querySelector("p.small").textContent = actualizar.descripcion;
            card.querySelector("p.fs-6").textContent = `$${actualizar.precio.toFixed(2)}`;
          } catch (err) {
            console.error(err);
            alert("Error al actualizar datos");
          }
        });
      }

      galleryContainer.appendChild(card);
    });

    // Mostrar u ocultar botón "Cargar más"
    loadMoreBtn.style.display = snapshot.size < pageSize ? "none" : "block";

    isFetching = false;
  };

  loadMoreBtn.addEventListener("click", cargarPulseras);
  cargarPulseras(); // carga inicial
}
