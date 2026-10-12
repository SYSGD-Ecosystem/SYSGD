# Plan: confidencialidad por tarea (públicas vs privadas)

## Motivación
Al invitar un colaborador a un proyecto, hoy vería TODAS las tareas (incluidas
sensibles, p. ej. seguridad de sesiones). Se pide: tareas públicas para todos
los miembros, tareas privadas solo para una lista de miembros con acceso, y el
dueño del proyecto siempre lo ve todo.

## Hallazgo previo (agravante)
`GET/POST /tasks` y `PUT /tasks/:id` no verifican membresía: cualquier usuario
autenticado con un `project_id` puede listar/crear/editar tareas de CUALQUIER
proyecto (solo `deleteTask` verifica). Los proyectos sí se filtran por acceso.
Este plan lo cierra de paso: sin membresía no hay tareas.

## Decisión: modelo
- `tasks.visibility`: `'public'` (defecto, cero ruptura) | `'private'`.
- `task_visible_to (task_id, user_id)`: lista explícita de acceso por tarea.
- Puede ver la tarea T del proyecto P si:
  - es admin (`privileges='admin'`, coherente con `deleteTask`), o
  - es dueño del proyecto (`projects.created_by`), o
  - es creador de la tarea (`tasks.created_by`), o
  - es miembro del proyecto (`resource_access`) y T es pública, o
  - T es privada y está en `task_visible_to` o en `task_assignees` (asignado ⇒
    la ve, si no no podría trabajar en ella).
- No miembro (ni owner/admin): lista vacía.

## Decisión: endpoints (todo a nivel SQL, nunca solo en cliente)
- `GET /tasks/:project_id`: exige sesión; filtra por la regla. No miembro → `[]`.
- `POST /tasks`: caller miembro/owner/admin (403 si no). Acepta `visibility`
  (defecto public) + `visible_to: string[]` (solo con private; deben ser miembros
  del proyecto, 400 si no). El creador/owner ven implícito, no van en la lista.
- `PUT /tasks/:id`: 404 si no existe O no es visible (anti-enumeración por ID).
  Si visible, edita (preserva edición colaborativa actual). Cambiar `visibility`
  /`visible_to`: solo owner, creador o admin.
- `DELETE /tasks/:id`: checks actuales + 404 si la privada no es visible.

## Cifrado en reposo (tal como contabilidad)
Servicio genérico `src/services/field-encryption.service.ts` (AES-256-GCM, formato
`enc1:<iv>:<datos>`, reutilizable desde cualquier componente):
`encryptField` / `decryptField` / `isEncryptedValue`.
- Clave: `DATA_ENCRYPTION_KEY` de 32 caracteres (Railway + local). Sin ella, falla
  ruidoso (fail closed). Generar: `openssl rand -base64 24 | cut -c1-32`. Perderla
  = datos ilegibles: respáldala.
- Aplicado a: `tasks.title/description` (lecturas y escrituras en
  `tasks.service.ts`) y `projects.name/description` (`project.controller.ts`),
  más el título copiado a `conversations` en los 2 sitios que nacen del proyecto
  (con descifrado en las 4 lecturas de `chat.ts`).
- Sin migración de esquema (columnas TEXT): lo nuevo se cifra al escribir; lo viejo
  en plano sigue leyéndose (passthrough). No hay `LIKE`/`ORDER BY` sobre esos
  campos, así que nada se rompe. Los títulos de chat creados por usuarios y
  `project_notes`/`time_entries`/mensajes quedan en plano (residual documentado).

## UI en client/ (HECHO, sin commitear)
- `Task`: `visibility` + `visible_to` (+ el servidor los devuelve en cada tarea).
- Crear/editar: selector Pública/Privada + "Quién puede ver" (solo miembros
  activos; el servidor rechaza invitados pendientes).
- Detalle: badge Privada + caja "Visible para". Lista: candado junto al título
  (desktop y móvil). Build `tsc + vite` verde.

## No entra ahora
- Blindaje por SQL directo (ya no hace falta con la UI).
- `project_notes`, `time_entries`, comentarios, contenido de mensajes: mismo patrón
  cuando toque.

## Archivos
`src/services/tasks.service.ts`, `src/controllers/tasks.controller.ts`,
`src/initDatabase.ts`, `migrations-manual/deploy-task-confidentiality.sql`.
