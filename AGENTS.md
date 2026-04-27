# AGENTS.md - Guía para Agentes de IA

Este documento guía a las IAs sobre cuándo trabajar en cada parte del proyecto.

---

## 🏗️ Estructura del Proyecto

```
SYSGD (Monorepo)
├── client/     → App React principal (PAGO)
├── accounting/                → App Angular + Android (GRATIS)
├── server/        → Backend API compartido
├── client/electron/                  → App de escritorio
├── admin/         → Panel de administración
└── web/             → Web pública
```

---

## 🎯 Cuándo trabajar en cada proyecto

### `client/` (Ecosistema Principal - App de Pago)

**Propósito**: Ecosistema completo de productividad empresarial. Es la aplicación principal del proyecto.

**Módulos**:
- 📁 Gestión Documental
- 📋 Gestión de Proyectos
- 📓 Contabilidad TCP (módulo de ingresos y gastos para múltiples clientes)
- 💬 Chats con Agentes de IA
- 🧠 Agentes de IA para asistencia

**Características del módulo de contabilidad**:
- Múltiples registros TCP por usuario
- Múltiples clientes/empresas
- Panel de control avanzado
- Enfoque: agentes contables que gestionan muchos clientes

**Señales para trabajar aquí**:
- Funcionalidades de gestión documental, proyectos, chats
- El usuario menciona "múltiples clientes", "agente contable"
- Cambios en la UI principal
- Cualquier módulo excepto sysgd-cont

---

### `accounting/` (App Gratuita)

**Propósito**: Aplicación gratuita para **trabajadores por cuenta propia individuales** (TCP).

**Componentes**:
- `accounting/` → App Angular (web)
- `accounting/android/` → App Android nativa
- Módulo de registro de ingresos y gastos para un solo usuario

**Características**:
- Un solo registro TCP por usuario
- Un solo cliente (el propio trabajador)
- Funcionalidad básica de contabilidad
- Enfoque: simplicidad, uso rápido desde móvil

**Señales para trabajar aquí**:
- El usuario menciona "cuentapropista", "un solo registro", "app android"
- Funcionalidad básica de registro de ingresos/gastos
- El usuario quiere algo "simple" o "para móviles"
- Trabajo en la app Angular o Android

---

### `server/node-server/` (Backend API)

**Ambos proyectos** (client y accounting) comparten el mismo backend.

**Señales para trabajar aquí**:
- Cambios en la API
- Nuevos endpoints
- Modificaciones en modelos de datos (afecta a ambos frontends)
- Migraciones de base de datos

---

## ⚠️ Reglas importantes

1. **No modificar `accounting/` desde `client/react-frontend/AGENTS.md`**
   - Cada subproyecto tiene su propio AGENTS.md con reglas específicas

2. **Si un cambio afecta a ambos frontends**, trabajar en el servidor primero y documentar el cambio

3. **Para accounting con Android**: Ver `accounting/android/AGENTS.md` para reglas específicas de la app móvil

---

## 📋 Prefijos de commits sugeridos

- `[cont-pro]` - Mejoras en la app de contabilidad de pago (client/react-frontend)
- `[cont-free]` - Mejoras en la app gratuita (accounting)
- `[cont-android]` - Mejoras en la app Android
- `[api]` - Cambios en el backend que afectan a ambos
