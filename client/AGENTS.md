# AGENTS.md - Reglas para IA (Frontend)

Este archivo define el estándar obligatorio para cualquier IA que modifique `client/react-frontend`.

## 1) Red y servidor

- Usa siempre `@/lib/api` para llamadas HTTP.
- No uses `fetch` ni instancias de `axios` creadas ad hoc en componentes/hooks.
- Centraliza headers, baseURL, auth y manejo de errores en la capa API.

Excepción:
- Solo se permite otra estrategia si existe una limitación técnica real. Debe quedar documentada en el PR/comentario técnico.

## 2) TypeScript

- `any` está prohibido.
- Define tipos e interfaces para props, respuestas de API, estado y callbacks.
- Prefiere `unknown` + validación/transformación antes que perder tipado.
- Evita castings inseguros (`as`) sin justificación.

## 3) UI y UX

- Todo componente debe ser responsive (móvil, tablet y escritorio).
- Todo componente debe funcionar en modo claro y oscuro.
- Evita que el contenido se rompa en móvil:
  - Texto largo: wrap.
  - Tablas/código/bloques anchos: `overflow-x-auto` en el elemento interno, no en toda la tarjeta/contenedor.

## 4) React y arquitectura

- Mantén componentes pequeños y reutilizables.
- Extrae lógica compleja a hooks/utilidades.
- Evita duplicación; crea componentes compartidos cuando haya 2+ usos reales.
- Mantén consistencia con aliases del proyecto (`@/...`).

## 5) Calidad mínima antes de cerrar cambios

Ejecuta, cuando aplique:

- `npm run lint`
- `npm run build`

Si no puedes ejecutar alguno, indícalo explícitamente y explica por qué.

## 6) Regla de oro

Si una decisión mejora velocidad pero rompe tipado, consistencia o UX móvil, **no se acepta**.
