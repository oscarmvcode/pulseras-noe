import { db, storage, auth } from "./firebase-config.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, deleteObject, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* =======================
   INDEXED DB CACHE
======================= */
const DB_NAME = "PulseritasCacheDB";
const STORE_NAME = "pulseras";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCache(key) {
  const db = await openDB();
  return new Promise(res => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => res(req.result?.data || null);
    req.onerror = () => res(null);
  });
}

async function setCache(key, data) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({ key, data, time: Date.now() });
}

async function clearUserCache(userKey) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const req = store.openCursor();
  req.onsuccess = e => {
    const cursor = e.target.result;
    if (cursor) {
      if (cursor.key.startsWith(userKey)) store.delete(cursor.key);
      cursor.continue();
    }
  };
}

/* =======================
   GALLERY
======================= */
export function initGallery(containerId, isAdmin = false) {
  const galleryContainer = document.getElementById(containerId);
  if (!galleryContainer) return;

  // ---------- LIGHTBOX ----------
  let lightbox = document.getElementById("lightbox");
  let lightboxImg = document.getElementById("lightbox-img");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "lightbox";
    lightbox.className =
      "fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center hidden z-50";
    lightbox.innerHTML =
      `<img id="lightbox-img" class="max-h-full max-w-full rounded-xl shadow-2xl">`;
    document.body.appendChild(lightbox);
    lightboxImg = document.getElementById("lightbox-img");
    lightbox.addEventListener("click", () => lightbox.classList.add("hidden"));
  }

  // ---------- PAGINACIÓN ----------
  const pageSize = 5;
  let lastCreatedAt = null;
  let isFetching = false;
  let currentPage = 0;

  const userKey = auth.currentUser ? auth.currentUser.uid : "public";

  let loadMoreBtn = document.getElementById("loadMoreAdmin");
  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "loadMoreAdmin";
    loadMoreBtn.className =
      "btn btn-pink-gradient w-100 py-2 rounded-full text-white shadow-md my-4";
    loadMoreBtn.textContent = "Cargar más 💖";
    galleryContainer.parentElement.appendChild(loadMoreBtn);
  }

  // ---------- RENDER ----------
  function renderCard(data, id, fragment) {
    const precioForm = Number(data.precio).toFixed(2);
    const card = document.createElement("div");
    card.className = "col-md-6 col-lg-4 mb-4";

    card.innerHTML = `
      <div class="card shadow-lg rounded-4 border-0 h-100 position-relative p-2">
        <img 
          src="${data.imagenURL}"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          class="card-img-top rounded-top-4 cursor-pointer"
          style="height:180px; object-fit:cover;">
        <div class="card-body text-center">
          <div class="display-mode">
            <h6 class="fw-bold text-pink-600 mb-1">${data.nombre}</h6>
            <p class="text-muted small mb-1">${data.descripcion}</p>
            <p class="fs-6 fw-bold text-rose-500 mb-2">$${precioForm}</p>
            ${isAdmin ? `
              <button class="btn btn-sm btn-outline-primary me-1 btn-edit">Editar</button>
              <button class="btn btn-sm btn-outline-danger btn-delete">Eliminar</button>
            ` : ""}
          </div>
          <div class="edit-mode d-none text-start">
            <input type="text" class="form-control mb-2 form-nombre" value="${data.nombre}" placeholder="Nombre">
            <textarea class="form-control mb-2 form-descripcion" rows="2" placeholder="Descripción">${data.descripcion}</textarea>
            <input type="number" class="form-control mb-2 form-precio" value="${data.precio}" placeholder="Precio" step="0.01" min="0">
            <input type="file" class="form-control mb-2 form-imagen" accept="image/jpeg,image/png">
            <div class="text-end">
              <button class="btn btn-sm btn-outline-success btn-save me-1">Guardar</button>
              <button class="btn btn-sm btn-outline-secondary btn-cancel">Cancelar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // ---------- LIGHTBOX ----------
    card.querySelector("img").onclick = () => {
      lightboxImg.src = data.imagenURL;
      lightbox.classList.remove("hidden");
    };

    // ---------- ELIMINAR ----------
    if (isAdmin && card.querySelector(".btn-delete")) {
      card.querySelector(".btn-delete").onclick = async () => {
        if (!confirm("¿Eliminar?")) return;
        try {
          if (data.imagePath) await deleteObject(ref(storage, data.imagePath));
        } catch (err) {
          console.warn("No se pudo borrar la imagen antigua:", err.message);
        }
        await deleteDoc(doc(db, "pulseras", id));
        card.remove();
      };
    }

    // ---------- EDITAR INLINE ----------
    if (isAdmin && card.querySelector(".btn-edit")) {
      const displayDiv = card.querySelector(".display-mode");
      const editDiv = card.querySelector(".edit-mode");
      const btnEdit = card.querySelector(".btn-edit");
      const btnSave = card.querySelector(".btn-save");
      const btnCancel = card.querySelector(".btn-cancel");
      const inputImagen = card.querySelector(".form-imagen");

      btnEdit.onclick = () => {
        displayDiv.classList.add("d-none");
        editDiv.classList.remove("d-none");
      };

      btnCancel.onclick = () => {
        editDiv.classList.add("d-none");
        displayDiv.classList.remove("d-none");
      };

      btnSave.onclick = async () => {
        const nombreNuevo = card.querySelector(".form-nombre").value.trim();
        const descripcionNueva = card.querySelector(".form-descripcion").value.trim();
        const precioNuevo = parseFloat(card.querySelector(".form-precio").value);
        const nuevaImagen = inputImagen.files[0];

        if (!nombreNuevo || !descripcionNueva || isNaN(precioNuevo) || precioNuevo <= 0) {
          return alert("Completa todos los campos correctamente");
        }

        try {
          let updatedData = {
            nombre: nombreNuevo,
            descripcion: descripcionNueva,
            precio: Number(precioNuevo.toFixed(2))
          };

          // Subir nueva imagen solo si se seleccionó
          if (nuevaImagen) {
            try {
              if (data.imagePath) await deleteObject(ref(storage, data.imagePath));
            } catch (err) {
              console.warn("No se pudo borrar la imagen antigua:", err.message);
            }

            const imagePath = `pulseras/${Date.now()}_${nuevaImagen.name}`;
            const imgRef = ref(storage, imagePath);
            await uploadBytes(imgRef, nuevaImagen);
            const imagenURL = await getDownloadURL(imgRef);

            updatedData.imagenURL = imagenURL;
            updatedData.imagePath = imagePath;

            // Actualizamos objeto original para futuras ediciones
            data.imagenURL = imagenURL;
            data.imagePath = imagePath;
          }

          await updateDoc(doc(db, "pulseras", id), updatedData);

          // Actualizar card visualmente
          card.querySelector(".display-mode h6").textContent = updatedData.nombre;
          card.querySelector(".display-mode p:nth-of-type(1)").textContent = updatedData.descripcion;
          card.querySelector(".display-mode p:nth-of-type(2)").textContent = `$${updatedData.precio.toFixed(2)}`;
          if (updatedData.imagenURL) card.querySelector("img").src = updatedData.imagenURL;

          editDiv.classList.add("d-none");
          displayDiv.classList.remove("d-none");

          alert("Pulsera actualizada 💖");
        } catch (err) {
          console.error(err);
          alert("Error al actualizar");
        }
      };
    }

    fragment.appendChild(card);
  }

  // ---------- LOAD ----------
  const cargarPulseras = async () => {
    if (isFetching) return;
    isFetching = true;

    const fragment = document.createDocumentFragment();

    // 🧠 Cache solo para público
    if (!isAdmin) {
      const cacheKey = `${userKey}_page_${currentPage}`;
      const cached = await getCache(cacheKey);

      if (cached) {
        cached.items.forEach(i => renderCard(i.data, i.id, fragment));
        galleryContainer.appendChild(fragment);
        lastCreatedAt = cached.lastCreatedAt;
        currentPage++;
        isFetching = false;
        return;
      }
    }

    // 🔥 Firebase query real
    let q = query(
      collection(db, "pulseras"),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastCreatedAt) {
      q = query(
        collection(db, "pulseras"),
        orderBy("createdAt", "desc"),
        startAfter(lastCreatedAt),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      loadMoreBtn.style.display = "none";
      isFetching = false;
      return;
    }

    const items = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      items.push({ id: docSnap.id, data });
      renderCard(data, docSnap.id, fragment);
    });

    galleryContainer.appendChild(fragment);
    lastCreatedAt = snapshot.docs[snapshot.docs.length - 1].data().createdAt;

    // 💾 Guardar cache solo público
    if (!isAdmin) {
      const cacheKey = `${userKey}_page_${currentPage}`;
      await setCache(cacheKey, { items, lastCreatedAt });
    }

    currentPage++;
    isFetching = false;

    // 🔥 Precarga para usuarios públicos
    if (!isAdmin && "requestIdleCallback" in window) {
      requestIdleCallback(() => cargarPulseras(), { timeout: 1500 });
    }
  };

  if (loadMoreBtn) loadMoreBtn.onclick = cargarPulseras;
  cargarPulseras();
}
