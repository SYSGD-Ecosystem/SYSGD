[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![Netlify Status](https://api.netlify.com/api/v1/badges/b5c4e985-e773-482a-978b-279aae78fd0e/deploy-status)](https://app.netlify.com/projects/sysgd/deploys)

# 🗃️ SYSGD Ecosystem

**SYSGD Ecosystem** comenzó como una plataforma de **Gestión Documental**, pero ha evolucionado hacia un **ecosistema modular para la productividad empresarial**.

Nos enfocamos en crear herramientas con una **interfaz simple, moderna e intuitiva**, listas para usarse sin curva de aprendizaje.

---

## 🔧 Módulos Actuales

- 📁 Gestión Documental
- 📋 Gestión de Proyectos

Próximamente: IA generativa, notificaciones, control de acceso por permisos, y más...

---

## 🚀 Características Principales

- 📁 Gestión de archivos documentales (entrada, salida, préstamo)
- 🧩 Módulos configurables como Cuadro de Clasificación Documental y Tablas de Retención
- 👥 Gestión de usuarios, roles, invitaciones y asignaciones de tareas
- 🔐 Autenticación con sesiones, cifrado de contraseñas y control de acceso
- 🌐 API RESTful desarrollada con Node.js + Express + PostgreSQL
- 🌈 Interfaz moderna con React + TailwindCSS
- 🧠 Integración con IA generativa (Gemini) mediante sistema de créditos (SYSGD-COINS)
- 📦 Uso de PostgreSQL con campos JSONB para estructuras documentales flexibles

## 📦 Tecnologías

### Backend

- Node.js
- Express
- PostgreSQL
- Passport + bcrypt
- Swagger para documentación de la API

### Frontend

- React
- TypeScript
- TailwindCSS

## 🧠 SYSGD-COINS

Sistema de créditos que permite a los usuarios utilizar funciones potenciadas con IA generativa. Cada usuario nuevo recibe 10 monedas para experimentar mejoras automatizadas en tareas. Se pueden adquirir más monedas para extender el uso de estas funciones.

## 📄 Licencia

Este proyecto está bajo la **GNU Affero General Public License v3.0**. Consulta el archivo `LICENSE` para más detalles.

## 📬 Contacto

- 📧 <lazaroyunier96@outlook.es>
- 📱 WhatsApp: [+53 51158544](https://wa.me/5351158544)

## 💡 Agradecimientos

Gracias a quienes apoyan el proyecto y comparten su uso en redes. Cada estrella en GitHub, cada feedback y cada línea de código que mejora este sistema cuenta.

---

**Visítanos. Pruébalo. Mejóralo. SYSGD es tuyo también.**

## 🚀 Instalación

### 🔌 Requisitos previos

- Node.js 18+
- PostgreSQL 12+
- Git

---

### 📁 Clonación

```bash
git clone https://github.com/tu-usuario/sysgd.git
cd sysgd
```

---

## 🚀 Instalación y Uso

### 🧩 Frontend

- Instalación por separado

El cliente está desarrollado con **Vite + React + Tailwind CSS**. Todos los archivos del frontend están en `client/react-frontend`.

```bash
cd client/react-frontend
npm install
cp .env.example .env
# Configura VITE_SERVER_URL (ej: http://localhost:3001)
npm run dev
```

### ⚙️ Backend

El servidor está en Node.js (Express) + PostgreSQL y se ubica en `server/node-server/`

```bash
cd server/node-server
npm install
cp .env.example .env
# Agrega variables de DB, Google Auth, etc.
npm run dev
```

### 🔄 Todo en una sola orden

Si ya instalaste dependencias en `client/react-frontend` y `server/node-server`, desde la raíz:

```bash
cd sysgd
npm install
npm run dev
```

### 🔐 Variables de entorno

Cada parte del sistema usa su archivo `.env`.

- `client/react-frontend/.env.example`
- `server/node-server/.env.example`

Duplica y renombra estos archivos a `.env` y completa los valores según tu entorno.

## Tecnologías utilizadas

| Capa            | Herramientas Principales                                                                |
| --------------- | --------------------------------------------------------------------------------------- |
| Frontend        | React 18, Vite 6, TailwindCSS 4, TypeScript, Zustand, Radix UI, TipTap, Markdown Editor |
| Backend         | Node.js, Express 5, TypeScript, PostgreSQL, Passport, Google OAuth2, Swagger            |
| Utilidades      | docx, xlsx, file-saver, markdown-it, rehype-sanitize, lucide-react, eslint, vite-plugin |
| Infraestructura | Netlify (frontend), PostgreSQL local o remoto, `.env` para configuración segura         |

---

## 🙋‍♂️ ¿Te gustaría colaborar?

¡Genial! Puedes enviar un PR, abrir una issue o simplemente escribirme.
Toda ayuda es bienvenida 🚀

![Node.js](https://img.shields.io/badge/Node.js-16+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-336791?logo=postgresql)
![docx](https://img.shields.io/badge/docx-%5E7.0.0-blue)
![xlsx](https://img.shields.io/badge/xlsx-%5E0.18.5-blue)
