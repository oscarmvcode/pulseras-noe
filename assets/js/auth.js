// assets/js/auth.js
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 Carga diferida de la galería (mejora tiempos)
let galleryInitialized = false;
let initGalleryFn = null;

document.addEventListener("DOMContentLoaded", () => {
  // Referencias DOM (una sola vez)
  const btnLogin = document.getElementById("btnLogin");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  if (!btnLogin || !loginBox || !adminPanel) return;

  /* ======================
     LOGIN
  ====================== */
  btnLogin.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Completa correo y contraseña");
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = "Entrando...";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged se encargará del resto
    } catch (err) {
      console.error(err);
      alert("Correo o contraseña incorrectos");
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar ✨";
    }
  });

  /* ======================
     AUTH STATE
  ====================== */
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Mostrar panel
      loginBox.classList.add("d-none");
      adminPanel.classList.remove("d-none");

      // 🔥 Import dinámico → JS solo se carga si hay admin
      if (!galleryInitialized) {
        const module = await import("./adminGallery.js");
        initGalleryFn = module.initGallery;

        initGalleryFn("adminGallery", true);
        galleryInitialized = true;
      }
    } else {
      // Mostrar login
      loginBox.classList.remove("d-none");
      adminPanel.classList.add("d-none");

      galleryInitialized = false;
    }
  });
});
