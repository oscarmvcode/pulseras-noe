// assets/js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzJGfnTC5cl8yz6VQySdm1EAVd5rEbVSQ",
  authDomain: "pulseritasnoe-66112.firebaseapp.com",
  projectId: "pulseritasnoe-66112",
  storageBucket: "pulseritasnoe-66112.firebasestorage.app",
  messagingSenderId: "550154997078",
  appId: "1:550154997078:web:d6847928a8ddc1d528daf7",
  measurementId: "G-WTP0QPY5YL"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
