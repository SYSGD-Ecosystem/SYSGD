# Plan: GCTCP Escritorio (Electron + SQLite3 offline)

*Fecha: 24/08/2026 · Análisis de `client/src/gctcp/` para versión de escritorio*

## 1. Diagnóstico del estado actual

### Qué hay en `src/gctcp/`
- Ya es **React 18 + TypeScript + shadcn/ui** moderno (364 KB, 29 archivos): vistas POS,
  Caja/Banco, DJ, libros, nomencladores, terceros, tributos, dashboard.
- Las vistas/módulos reciben datos por **props y callbacks** desde `GC_TCP.tsx`
  (buen desacoplamiento de UI).
- **Toda la capa de datos vive en solo 2 archivos**: `GC_TCP.tsx` (1 `GET /api/cont-ledger`
  + ~9 `PUT /api/cont-ledger`) y `UploadBackupPanel.tsx` (1 `PUT`). El modelo es
  *cargar contenedor completo / guardar contenedor completo* (`CloudLedgerContainer`).

### Shell de Electron (`client/electron/`)
- Solo gestiona **licencias RSA** (machine-id, código de activación) y ventanas.
- **No tiene ninguna integración SQLite.**
- `sqlite3@6` está declarado en `client/package.json` pero **sin usar** en ningún sitio.
- `electron-builder` ya configurado: **AppImage (Linux) + NSIS (Windows)**.
- **Electron 39 ⇒ Node 22 ⇒ trae `node:sqlite` incorporado**: base de datos SQLite
  **sin compilar módulos nativos ni electron-rebuild**.

### Referencias de producto
- **Android (repo GCTCP)**: Kotlin + Room/SQLite offline-first, módulos espejo
  (`modules/<nombre>`), esquema `AppDatabase` v17. Es el estándar de comportamiento offline.
- **Web**: servidor Node + PostgreSQL, todo remoto.

## 2. Decisión: ¿cliente nuevo o evolucionar el actual?

**NO crear un cliente React nuevo.** Razones:

1. El problema no es la UI ni el framework — es que la capa de datos está soldada a HTTP.
   Eso se arregla con una abstracción de ~50 líneas, no con un proyecto nuevo.
2. Duplicar las vistas = **doble mantenimiento** y divergencia garantizada entre versión
   web y escritorio (el mismo bug se arregla dos veces).
3. La superficie a tocar es mínima: **2 archivos** concentran todas las llamadas.
4. Con detección de entorno en runtime, **el mismo build sirve web y escritorio**.

## 3. Arquitectura propuesta

```
GC_TCP.tsx / UploadBackupPanel
        │  (única frontera de datos)
        ▼
LedgerRepository  (interfaz TypeScript)
        ├── RepositorioRemoto   → axios → servidor Node/Postgres   ← modo WEB (actual)
        └── RepositorioLocal    → window.electronAPI (IPC invoke)  ← modo ESCRITORIO
                                        │
                              Electron main process
                              node:sqlite (sin rebuild)
                                        │
                              userData/gctcp.db (SQLite3)
```

- Detección de modo: `typeof window.electronAPI !== "undefined"` (ya existe el bridge).
- La app escritorio funciona **100% offline**; la sincronización con el servidor es una
  fase opcional posterior.

### Motor de datos
| Opción | Pros | Contras |
|---|---|---|
| **`node:sqlite` (elegida)** | Cero dependencias nativas, incluida en Node 22 de Electron 39 | API algo nueva |
| better-sqlite3 | API excelente | Requiere electron-rebuild por versión de Electron |
| sql.js (WASM) | Sin rebuild | Persistencia manual a archivo, más lento |

Fallback: si `node:sqlite` diera problemas, migrar a better-sqlite3 + electron-rebuild
(la interfaz del repositorio lo permite sin tocar la UI).

### Esquema SQLite
**Opción elegida: espejo gradual del esquema Room de Android (v17).**
- Paridad conceptual móvil ⇄ escritorio (mismas entidades: wallets, productos, terceros,
  órdenes de servicio, etc.).
- Migraciones numeradas igual que Room.
- Permite a futuro exportar/importar backups compatibles entre plataformas.
- Fase inicial puede arrancar con las tablas núcleo y crecer módulo a módulo.

(Alternativa descartada: guardar el `CloudLedgerContainer` como blob JSON en una tabla —
sería "usar SQLite" de nombre y bloquearía informes/consultas locales.)

## 4. Fases de implementación

1. **Fase 0 — Decisiones cerradas**: motor (`node:sqlite`, fallback better-sqlite3),
   esquema (espejo Room v17), sync diferido. Eliminar dep `sqlite3@6` sin usar.
2. **Fase 1 — Contrato de datos**: extraer `LedgerRepository` + implementación remota;
   cambiar `GC_TCP.tsx` y `UploadBackupPanel.tsx` para usar el repositorio.
   Cambio mecánico, bajo riesgo (las vistas siguen intactas).
3. **Fase 2 — SQLite en Electron**: en `main.js`, abrir `userData/gctcp.db`,
   migraciones numeradas, handlers IPC `ledger:cargar` / `ledger:guardar`;
   exponer por `preload.js`; `RepositorioLocal` en el renderer.
4. **Fase 3 — Modo offline en UI**: selección de repositorio según entorno,
   indicador visual "Trabajando offline", arranque sin login de servidor
   (licencia local ya existe).
5. **Fase 4 — Sincronización opcional**: cuando hay red, push/pull del contenedor
   contra `/api/cont-ledger` (last-write-wins como hoy). Cola simple de cambios.
6. **Fase 5 — Empaquetado y pruebas**: electron-builder (AppImage/NSIS ya listos),
   verificación de licencia offline, pruebas de datos en ambas plataformas.

## 5. Riesgos y notas

- Verificar en el Electron instalado: `node -e "require('node:sqlite')"` antes de Fase 2.
- El patrón PUT-contenedor-entero simplifica el offline (fases 1–3 pueden mantenerlo);
  refinar a operaciones por entidad solo si aparece necesidad de concurrencia.
- `capacitor.config.ts` empaqueta este mismo `dist` para móvil viejo: decidir si se
  mantiene o se deprecó al favor del cliente Android nativo.
- Las licencias RSA del shell ya resuelven el gating Pro de escritorio.
