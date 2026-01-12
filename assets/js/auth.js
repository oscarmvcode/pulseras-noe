// assets/js/auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  // Seleccionamos elementos del DOM
  const btnLogin = document.getElementById("btnLogin");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  // Si no existe el botón de login, salimos
  if (!btnLogin) return;

  // EVENTO LOGIN
  btnLogin.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) return alert("Completa correo y contraseña");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login correcto");
    } catch (err) {
      console.error(err);
      alert("Correo o contraseña incorrectos");
    }
  });

  // ON AUTH STATE CHANGE
  onAuthStateChanged(auth, (user) => {
    if (!loginBox || !adminPanel) return;

    if (user) {
      // Usuario logueado → ocultamos login y mostramos panel
      loginBox.classList.add("d-none");
      adminPanel.classList.remove("d-none");
    } else {
      // No hay usuario → mostramos login y ocultamos panel
      loginBox.classList.remove("d-none");
      adminPanel.classList.add("d-none");
    }
  });
});
