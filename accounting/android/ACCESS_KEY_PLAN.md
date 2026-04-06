# Llave de Acceso Offline - SYSGD Cont Android

## Resumen

Sistema de respaldo de sesión que permite iniciar sesión en la app Android **sin conexión a internet**, diseñado para usuarios con planes PRO y VIP.

---

## Arquitectura General

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  App Android    │         │   Servidor API   │         │   PostgreSQL    │
│ (genera deviceId│         │ (firma con RSA)  │         │                 │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │ 1. Solicitar llave        │                            │
         │    (deviceId + tier)      │                            │
         ├──────────────────────────►│                            │
         │                           │ 2. Verificar tier PRO/VIP   │
         │                           │ 3. Crear access_key        │
         │                           │    - deviceId              │
         │                           │    - token (JWT offline)   │
         │                           │    - firma RSA             │
         │                           ├───────────────────────────►│
         │◄──────────────────────────┤                            │
         │ 4. access_key.json       │                            │
         │    (encriptado + firmado) │                            │
         │                           │                            │
         │ 5. Guardar local        │                            │
         │                           │                            │
         │ 6. Login offline:        │                            │
         │    - Verificar firma RSA  │                            │
         │    - Extraer token        │                            │
         │    - Usar token para API  │                            │
         └───────────────────────────┘                            │
```

---

## Base de Datos (PostgreSQL)

### Nueva tabla `access_keys`

```sql
CREATE TABLE access_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    device_id       TEXT NOT NULL,           -- Hash del dispositivo móvil
    token           TEXT NOT NULL,           -- JWT firmable offline
    signature       TEXT NOT NULL,           -- Firma RSA
    tier            TEXT NOT NULL,           -- 'pro' o 'vip'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    last_used_at    TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    UNIQUE(user_id, device_id)              -- 1 llave por dispositivo
);
```

---

## Backend - Server (Node.js)

### Servicio: `src/services/access-key.service.ts`

**Funciones principales:**
- `generateAccessKey(userId, deviceId, tier)` - Genera llave RSA-firmada
- `verifyAccessKeySignature(signature, payload)` - Verifica firma RSA
- `revokeAccessKey(keyId, userId)` - Revoca una llave
- `getUserAccessKeys(userId)` - Lista llaves del usuario
- `checkUserTier(userId)` - Verifica si es PRO/VIP

### Endpoints: `src/routes/access-key.routes.ts`

```
POST /api/access-keys/generate
  Body: { deviceId: string }
  Auth: JWT required
  Verifica: Usuario es PRO/VIP
  Returns: { accessKey: AccessKeyPayload, signature: string }

GET /api/access-keys
  Auth: JWT required
  Returns: [{ id, deviceId, createdAt, lastUsedAt, isActive }]

DELETE /api/access-keys/:id
  Auth: JWT required
  Returns: { success: boolean }

GET /api/access-keys/validate-tier
  Auth: JWT required
  Returns: { tier: 'pro'|'vip'|'free', canCreateKey: boolean }
```

### Modelo AccessKeyPayload

```typescript
interface AccessKeyPayload {
  id: string;           // UUID de la llave
  userId: string;       // ID del usuario
  email: string;        // Email del usuario
  deviceId: string;     // Hash del dispositivo
  tier: 'pro' | 'vip'; // Plan del usuario
  token: string;        // JWT para operaciones offline
  issuedAt: string;    // ISO timestamp
}
```

---

## Frontend Android

### Modelo de Datos

```kotlin
data class AccessKey(
    val id: String,
    val userId: String,
    val email: String,
    val deviceId: String,
    val tier: String,
    val token: String,
    val signature: String,  // Firma RSA
    val issuedAt: String
)
```

### API Service (ApiService.kt)

```kotlin
@POST("api/access-keys/generate")
suspend fun generateAccessKey(
    @Header("Authorization") token: String,
    @Body request: GenerateAccessKeyRequest
): Response<AccessKeyResponse>

@GET("api/access-keys/validate-tier")
suspend fun validateTier(
    @Header("Authorization") token: String
): Response<TierValidationResponse>

@GET("api/access-keys")
suspend fun getAccessKeys(
    @Header("Authorization") token: String
): Response<List<AccessKeyInfo>>

@DELETE("api/access-keys/{id}")
suspend fun revokeAccessKey(
    @Header("Authorization") token: String,
    @Path("id") keyId: String
): Response<Unit>
```

### AuthRepository - Lógica Offline

```kotlin
// Generar ID de dispositivo único
fun getDeviceId(): String {
    val androidId = Settings.Secure.getString(
        context.contentResolver, 
        Settings.Secure.ANDROID_ID
    )
    return SHA256(androidId + Build.SERIAL + Build.FINGERPRINT)
}

// Guardar llave localmente
suspend fun saveAccessKey(accessKey: AccessKey): Result<Unit>

// Cargar llave local
suspend fun getLocalAccessKey(): AccessKey?

// Eliminar llave local
suspend fun deleteLocalAccessKey()

// Verificar firma RSA offline
fun verifyAccessKeySignature(accessKey: AccessKey): Boolean

// Login con llave offline
suspend fun loginWithAccessKey(accessKey: AccessKey, password: String): Result<AuthUser>
```

---

## Flujo de Usuario

### Crear Llave (requiere internet)

1. Usuario inicia sesión normalmente
2. Va a Menú → Respaldo JSON → Crear llave de acceso
3. App genera `deviceId` y envía al servidor
4. Servidor verifica que es PRO/VIP
5. Servidor genera `access_key.json` firmado con RSA
6. Usuario guarda el archivo

### Usar Llave (OFFLINE)

1. Usuario abre app (sin internet)
2. Toca "Llave de acceso (sin internet)"
3. Selecciona archivo `access_key.json`
4. App verifica firma RSA localmente ✓
5. App extrae `token` del payload
6. Usa `token` para operaciones en la app
7. Si necesita sync, lo hace cuando tenga internet

---

## Verificación RSA Offline

Usar la misma clave pública RSA embebida en la app (igual que Electron):

```kotlin
// Clave pública RSA embebida
private val PUBLIC_KEY = """
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
    -----END PUBLIC KEY-----
""".trimIndent()

fun verifySignature(payload: String, signature: String): Boolean {
    val signatureBytes = Base64.decode(signature, Base64.NO_WRAP)
    val payloadBytes = payload.toByteArray(Charsets.UTF_8)
    
    val sig = Signature.getInstance("SHA256withRSA")
    val keyFactory = KeyFactory.getInstance("RSA")
    val publicKey = keyFactory.generatePublic(X509EncodedKeySpec(
        Base64.decode(PUBLIC_KEY, Base64.NO_WRAP)
    ))
    
    sig.initVerify(publicKey)
    sig.update(payloadBytes)
    return sig.verify(signatureBytes)
}
```

---

## Archivos a Modificar

### Server

| Archivo | Cambio |
|---------|--------|
| `src/services/access-key.service.ts` | Nuevo - Lógica de generación y verificación |
| `src/routes/access-key.routes.ts` | Nuevo - Endpoints REST |
| `src/routes/index.ts` | Registrar nuevas rutas |
| `src/initDatabase.ts` | Crear tabla `access_keys` |

### Android

| Archivo | Cambio |
|---------|--------|
| `AuthModels.kt` | Añadir modelos `AccessKey`, `GenerateAccessKeyRequest` |
| `ApiService.kt` | Añadir endpoints de access-keys |
| `AuthRepository.kt` | Lógica de deviceId, guardar/cargar llave, verificación RSA |
| `AuthViewModel.kt` | Funciones de UI para llaves |
| `MainScreen.kt` | UI de creación de llaves en BackupJsonScreen |
| `LoginScreen.kt` | UI de login con llave offline |

---

## Seguridad

- **Device binding**: La llave solo funciona en el dispositivo donde se creó
- **Firma RSA**: Imposible falsificar la llave sin la clave privada del servidor
- **Token JWT**: Permite operaciones offline autenticadas
- **Revocación**: Usuario puede revocar llaves desde la app o web
- **Un usuario = Un dispositivo**: Previene compartir llaves
- **Validación de tier**: Solo usuarios PRO/VIP pueden crear llaves

---

## Estado Actual

**Implementado:**
- [x] Plan detallado en este README
- [ ] Backend: Servicio y endpoints
- [ ] Backend: Base de datos
- [ ] Android: Modelos y API
- [ ] Android: Lógica de deviceId y RSA
- [ ] Android: UI de creación de llaves
- [ ] Android: UI de login con llave

---

## Referencia

Este sistema está inspirado en el sistema de licencias RSA existente para la app Electron del cliente principal (`/client/electron/`).
