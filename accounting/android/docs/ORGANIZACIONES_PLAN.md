# Sistema de Organizaciones - Plan de Implementación

Este documento describe el plan para implementar el sistema de organizaciones compartidas en la app **SYSGD Cont** (Accounting).

## 1. Modelo de Datos

### Estructura Jerárquica

```
Usuario (tabla existente)
└── Organizaciones (creadas por el usuario)
    ├── Miembros (referencia a usuarios)
    ├── Período activo
    └── Métricas por período
        ├── Ventas por empleado
        ├── Transacciones por empleado
        └── Actividad por empleado
```

### Tablas SQL

```sql
-- Organizaciones
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT,
    updated_at TEXT
);

-- Miembros de organización (referencia a users)
CREATE TABLE organization_members (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT CHECK (role IN ('admin', 'editor', 'viewer')),
    joined_at TEXT,
    UNIQUE(organization_id, user_id)
);

-- Registro de actividad (referencia a users)
CREATE TABLE organization_activity_log (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    action_type TEXT,  -- 'sale', 'purchase', 'adjustment', 'login', etc.
    action_details TEXT,
    created_at TEXT
);

-- Invitaciones de organización
CREATE TABLE organization_invitations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    invited_email TEXT NOT NULL,
    invited_user_id TEXT REFERENCES users(id),
    role TEXT DEFAULT 'editor',
    status TEXT DEFAULT 'pending',  -- pending, accepted, rejected, expired
    created_at TEXT,
    expires_at TEXT
);
```

### Modelos Kotlin

```kotlin
@Entity(tableName = "organizations")
data class Organization(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val ownerId: String,  // FK -> users.id
    val createdAt: String,
    val updatedAt: String
)

@Entity(tableName = "organization_members")
data class OrganizationMember(
    @PrimaryKey val id: String,
    val organizationId: String,  // FK -> organizations.id
    val userId: String,         // FK -> users.id
    val role: String,            // admin, editor, viewer
    val joinedAt: String
)

@Entity(tableName = "organization_activity_log")
data class OrganizationActivityLog(
    @PrimaryKey val id: String,
    val organizationId: String,  // FK -> organizations.id
    val userId: String,          // FK -> users.id
    val actionType: String,
    val actionDetails: String,
    val createdAt: String
)

@Entity(tableName = "organization_invitations")
data class OrganizationInvitation(
    @PrimaryKey val id: String,
    val organizationId: String,  // FK -> organizations.id
    val senderId: String,        // FK -> users.id
    val invitedEmail: String,
    val invitedUserId: String?,  // FK -> users.id (nullable hasta que acepte)
    val role: String,
    val status: String,
    val createdAt: String,
    val expiresAt: String
)
```

### Consultas con JOIN (ejemplos)

```kotlin
// Obtener miembros con datos de usuario
@Query("""
    SELECT m.*, u.name as user_name, u.email as user_email
    FROM organization_members m
    JOIN users u ON m.user_id = u.id
    WHERE m.organization_id = :orgId
""")
fun getMembersWithUserData(orgId: String): Flow<List<MemberWithUser>>

// Obtener actividad con nombre de usuario
@Query("""
    SELECT a.*, u.name as user_name
    FROM organization_activity_log a
    JOIN users u ON a.user_id = u.id
    WHERE a.organization_id = :orgId
    ORDER BY a.created_at DESC
""")
fun getActivityWithUserData(orgId: String): Flow<List<ActivityWithUser>>
```

---

## 2. Endpoints de API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/organizations` | Listar organizaciones del usuario |
| POST | `/api/organizations` | Crear organización |
| GET | `/api/organizations/:id` | Detalle de organización |
| PUT | `/api/organizations/:id` | Actualizar organización |
| DELETE | `/api/organizations/:id` | Eliminar organización |
| GET | `/api/organizations/:id/members` | Listar miembros (con datos de usuario) |
| POST | `/api/organizations/:id/members` | Agregar miembro (invitar) |
| PUT | `/api/organizations/:id/members/:userId` | Cambiar rol de miembro |
| DELETE | `/api/organizations/:id/members/:userId` | Eliminar miembro |
| GET | `/api/organizations/:id/activity` | Historial de actividad (con nombres de usuario) |
| GET | `/api/organizations/:id/metrics` | Métricas por empleado |
| POST | `/api/organizations/:id/activity` | Registrar actividad |
| GET | `/api/organizations/:id/invitations` | Listar invitaciones pendientes |
| POST | `/api/organizations/:id/invite` | Enviar invitación |
| POST | `/api/organizations/:id/invitations/:invId/accept` | Aceptar invitación |
| POST | `/api/organizations/:id/invitations/:invId/reject` | Rechazar invitación |
| GET | `/api/invitations/received` | Listar invitaciones recibidas |

---

## 3. Estructura UI - Drawer

```
┌─────────────────────────┐
│  ● Usuario               │
│    usuario@email.com     │
│    Créditos: 10         │
├─────────────────────────┤
│ 📊 ORGANIZACIONES       │  ← NUEVA SECCIÓN
│   ▼ Mi Organización    │
│     • Dashboard          │
│     • Miembros           │
│     • Agregar miembro    │
│     • Métricas          │
│   ▼ Invitaciones (2)   │
│     • Pendientes        │
├─────────────────────────┤
│ Herramientas             │
│   ► Punto de Venta      │
│   ► Nomencladores       │
│   ► Terceros            │
├─────────────────────────┤
│ Configuración            │
└─────────────────────────┘
```

---

## 4. Pantallas a Implementar

| Pantalla | Descripción | Archivo |
|----------|-------------|---------|
| `OrganizationsScreen` | Lista de organizaciones + crear nueva | `OrganizationsScreen.kt` |
| `OrganizationDetailScreen` | Dashboard de la org seleccionada | `OrganizationDetailScreen.kt` |
| `MembersScreen` | Gestión de miembros con roles | `MembersScreen.kt` |
| `MetricsScreen` | Métricas de productividad por empleado | `MetricsScreen.kt` |
| `ActivityLogScreen` | Historial de actividad detallado | `ActivityLogScreen.kt` |
| `InviteMemberDialog` | Modal para invitar por email | (integrado en MembersScreen) |
| `ReceivedInvitationsScreen` | Invitaciones pendientes | `ReceivedInvitationsScreen.kt` |

---

## 5. Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Admin** | Todo: gestión de org, miembros, métricas, datos |
| **Editor** | Ventas, compras, inventario. No ve métricas de otros |
| **Viewer** | Solo lectura, no puede hacer transacciones |

**Regla importante:** Los empleados (editor/viewer) solo ven **su propia actividad**, no la de otros miembros.

---

## 6. Métricas de Productividad

```kotlin
data class EmployeeMetrics(
    val userId: String,
    val userName: String,  // Obtenido via JOIN con users
    val period: String,
    val salesCount: Int,
    val salesAmount: Double,
    val purchasesCount: Int,
    val purchasesAmount: Double,
    val activityCount: Int,
    val lastActivity: String
)

data class OrganizationMetrics(
    val organizationId: String,
    val period: String,
    val totalSales: Double,
    val totalPurchases: Double,
    val employeeMetrics: List<EmployeeMetrics>,
    val topPerformingEmployeeId: String?
)
```

---

## 7. Flujo de Registro de Actividad

Cada vez que un empleado realiza una acción, se registra:

```kotlin
fun logActivity(
    organizationId: String,
    userId: String,
    actionType: String,
    details: String
) {
    val log = OrganizationActivityLog(
        id = UUID.randomUUID().toString(),
        organizationId = organizationId,
        userId = userId,  // Solo el ID, nombre se obtiene via JOIN
        actionType = actionType,
        actionDetails = details,
        createdAt = LocalDateTime.now().toString()
    )
    repository.insertActivity(log)
}
```

### Tipos de Acción

| Tipo | Descripción |
|------|-------------|
| `sale` | Venta registrada |
| `purchase` | Compra registrada |
| `inventory_adjustment` | Ajuste de inventario |
| `login` | Inicio de sesión |
| `logout` | Cierre de sesión |
| `profile_update` | Actualización de perfil |

---

## 8. Cambios en Modelos Existentes

### Venta (InventarioModels.kt)

```kotlin
@Entity(tableName = "ventas")
data class Venta(
    @PrimaryKey val id: String,
    val clienteId: String = "",
    val clienteNombre: String = "",
    val subtotal: Double,
    val descuento: Double = 0.0,
    val total: Double,
    val montoRecibido: Double,
    val cambio: Double,
    val metodoPago: String,
    val observaciones: String = "",
    val fecha: String,
    val almacenId: String,
    // Nuevos campos para organizaciones
    val organizationId: String? = null,
    val createdByUserId: String? = null  // FK -> users.id
)
```

### Compra (InventarioModels.kt)

```kotlin
@Entity(tableName = "compras")
data class Compra(
    @PrimaryKey val id: String,
    val proveedorId: String = "",
    val proveedorNombre: String = "",
    val subtotal: Double,
    val descuento: Double = 0.0,
    val total: Double,
    val montoPagado: Double,
    val metodoPago: String,
    val observaciones: String = "",
    val fecha: String,
    val almacenId: String,
    // Nuevos campos para organizaciones
    val organizationId: String? = null,
    val createdByUserId: String? = null  // FK -> users.id
)
```

---

## 9. Estructura de Archivos

```
app/src/main/java/cu/lazaroysr96/sysgdcont/
├── data/
│   ├── model/
│   │   ├── Organization.kt
│   │   ├── OrganizationMember.kt
│   │   ├── OrganizationActivityLog.kt
│   │   └── OrganizationInvitation.kt
│   ├── dao/
│   │   └── OrganizationDao.kt
│   └── repository/
│       └── OrganizationRepository.kt
├── viewmodel/
│   └── OrganizationViewModel.kt
└── ui/main/screens/
    ├── OrganizationsScreen.kt
    ├── OrganizationDetailScreen.kt
    ├── MembersScreen.kt
    ├── MetricsScreen.kt
    ├── ActivityLogScreen.kt
    └── ReceivedInvitationsScreen.kt
```

---

## 10. Orden de Implementación Sugerido

### Fase 1: Modelos y DAOs
- [ ] Crear entidades Organization, OrganizationMember, OrganizationActivityLog, OrganizationInvitation
- [ ] Crear OrganizationDao con todas las consultas (usar JOIN para obtener datos de usuario)

### Fase 2: Repositorios
- [ ] OrganizationRepository con CRUD completo
- [ ] Sincronización con backend

### Fase 3: ViewModels
- [ ] OrganizationViewModel con estado de UI
- [ ] Modificar InventarioViewModel para soportar org activa

### Fase 4: UI - Navegación
- [ ] Agregar sección "Organizaciones" al drawer (MainScreen.kt)
- [ ] Pantalla de lista de organizaciones
- [ ] Selector de organización activa

### Fase 5: UI - Gestión de Miembros
- [ ] Pantalla de miembros
- [ ] Dialog de invitación
- [ ] Pantalla de invitaciones recibidas

### Fase 6: UI - Métricas
- [ ] Dashboard de métricas
- [ ] Detalle por empleado
- [ ] Gráficos de productividad

### Fase 7: Registro de Actividad
- [ ] Modificar Venta/Compra para registrar actividad
- [ ] Historial de actividad por usuario
- [ ] Métricas agregadas

---

## 11. Consideraciones de Diseño

### Normalización de Datos
- **NO** duplicar campos de `users` en otras tablas
- Usar `user_id` como FK y hacer JOIN para obtener `name`, `email`
- El servidor devuelve datos completos en las respuestas de API

### Sincronización
- Las organizaciones se sincronizan con el servidor
- Los miembros comparten acceso a los mismos datos
- Las métricas se calculan tanto local como remotamente

### Offline
- Los miembros pueden trabajar offline
- Al reconectar, se sincronizan cambios
- Conflictos se resuelven por timestamp (último gana)

### Seguridad
- Validar permisos en servidor para cada acción
- No confiar en permisos del cliente
- Roles verificados en cada request

---

## 12. Inspiración

Este diseño está basado en el sistema de workspaces/compartición existente en el cliente principal (react-frontend), específicamente en:
- `client/src/hooks/connection/useProjectMembers.ts`
- `client/src/components/projects/TeamManagement.tsx`
- `client/src/components/dialogs/DialogInvite.tsx`
- Endpoints en `server/src/routes/members.ts`

---

*Documento creado: 2026-04-15*
*Para uso interno del equipo de desarrollo*
