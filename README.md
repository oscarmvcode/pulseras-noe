# Pulseras Noe — README Técnico

## 1. Visión General

**Pulseras Noe** es una aplicación web completamente **frontend‑only**, diseñada como una galería dinámica de productos artesanales. El sistema utiliza una arquitectura moderna basada en **Firebase como Backend as a Service (BaaS)** y está optimizado para despliegue en **GitHub Pages** sin servidores propios.

La aplicación permite:

* Visualización pública de productos en modo solo lectura
* Gestión administrativa privada (CRUD)
* Almacenamiento seguro de imágenes
* Hosting estático sin infraestructura backend dedicada

---

## 2. Paradigma de Arquitectura

### 2.1 Estilo Arquitectónico

* **Jamstack** (JavaScript + APIs + Markup)
* **Serverless / Backendless**
* Comportamiento tipo **SPA** implementado con JavaScript Vanilla

### 2.2 Modelo de Despliegue

* Hosting de archivos estáticos mediante **GitHub Pages (CDN)**
* Comunicación con backend vía **Firebase SDK sobre HTTPS**

---

## 3. Stack Tecnológico

### 3.1 Capa Frontend

* **HTML5**

  * Marcado semántico
  * Estructura accesible y SEO-friendly
  * Compatibilidad cross‑browser

* **CSS3**

  * Estilos personalizados
  * Animaciones y transiciones
  * Diseño responsive

* **Tailwind CSS (CDN)**

  * Enfoque utility‑first
  * Mobile‑first design
  * Composición rápida de UI

* **Bootstrap 5.3**

  * Sistema de grillas
  * Componentes UI
  * Consistencia visual

* **JavaScript (ES6+)**

  * Módulos ES (`import / export`)
  * Programación asíncrona con `async/await`
  * Manipulación del DOM
  * Delegación de eventos

---

## 4. Backend como Servicio (Firebase)

### 4.1 Servicios Firebase Utilizados

* **Firebase Authentication**

  * Proveedor Email/Password
  * Persistencia de sesión
  * Autorización basada ******

* **Cloud Firestore**

  * Base de datos NoSQL orientada a documentos
  * Estructura flexible de colecciones
  * Consultas indexadas con ordenamiento y paginación

* **Firebase Storage**

  * Almacenamiento de archivos binarios
  * Gestión de imágenes vía CDN
  * Eliminación sincronizada con Firestore

---

## 5. Modelo de Seguridad

### 5.1 Autenticación

* Acceso administrativo restringido *****
* Sesión persistente controlada por Firebase Auth

### 5.2 Reglas de Seguridad

**Firestore Rules**:

* Lectura pública
* Escritura exclusiva para *****

**Storage Rules**:

* Lectura pública
* Escritura restringida por *****

---

## 6. Estructura del Proyecto

```
/
├── index.html           # Galería pública
├── admin.html           # Panel de administración
├── assets/
│   └── css/
│       └── custom.css   # Estilos personalizados
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── upload.js
│   └── adminGallery.js
└── README.md
```

---

## 7. Flujo de Datos

1. Usuario accede a la galería pública
2. Firestore devuelve documentos ordenados por `createdAt`
3. Firebase Storage sirve las imágenes
4. Admin autenticado puede crear, editar o eliminar productos
5. Las acciones CRUD actualizan Firestore y Storage de forma atómica

---

## 8. Paginación y Rendimiento

* Paginación basada en cursores (`startAfter`)
* Ordenamiento por `serverTimestamp`
* Carga progresiva de elementos

---

## 9. Validaciones Frontend

* Validación de tamaño de imagen (≤ 2 MB)
* Validación de tipos MIME (`image/jpeg`, `image/png`)
* Sanitización básica de inputs
* Prevención de operaciones sin autenticación

---

## 10. Control de Versiones

* Repositorio Git
* `.gitignore` optimizado para frontend Firebase
* Exclusión de dependencias, logs y archivos sensibles

---


## 11. Autoría

**Diseñado y desarrollado con 💻 y 💖 por RabbitCode**

Proyecto creado como solución real para un negocio artesanal, priorizando simplicidad, seguridad y rendimiento.
