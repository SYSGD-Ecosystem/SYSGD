# Instrucciones para Agentes - SYSGD Cont

## Compilar APK Debug

```bash
# Usar Java 17 (Java 21 tiene problemas con AGP 8.2)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Compilar
./gradlew assembleDebug
```

## Instalar APK en dispositivo

```bash
# Conexión local
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Conexión remota (primero conectar)
adb connect 192.168.x.x:5555
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Estructura del Proyecto

```
android/
├── app/src/main/java/cu/lazaroysr96/sysgdcont/
│   ├── data/
│   │   ├── api/          # Retrofit API service
│   │   ├── model/        # Data classes
│   │   └── repository/   # Repositorios (DataStore)
│   ├── di/               # Módulos Hilt
│   ├── ui/
│   │   ├── auth/         # Login screen
│   │   ├── main/         # Main screen + screens/
│   │   ├── navigation/   # Navigation routes
│   │   └── theme/        # Compose theme
│   └── viewmodel/        # ViewModels (MVVM)
├── build.gradle          # Root build config
└── app/build.gradle     # App module config
```

## Requisitos

- Java 17 (no usar Java 21)
- Android SDK Platform 34
- Gradle 8.5 (incluido via wrapper)

## Tecnologías Usadas

- **UI**: Jetpack Compose + Material 3
- **DI**: Hilt
- **Networking**: Retrofit + OkHttp
- **Persistence**: DataStore (SharedPreferences)
- **Navigation**: Navigation Compose

## Autenticación

La app soporta:
1. **Login normal**: email + contraseña
2. **Token manual**: para usuarios que iniciaron con Google

Para obtener token manualmente:
1. Inicia sesión en la web
2. DevTools (F12) → Application → Local Storage
3. Copia `sysgd-cont:auth-token`
4. En la app: "Método avanzado (token)"

## API Endpoints

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/cont-ledger` - Obtener registro
- `PUT /api/cont-ledger` - Actualizar registro

## Reglas para Commits

Al finalizar cualquier cambio, el agente debe sugerir:
- **Título**: Formato conventional commits (feat, fix, chore, docs, etc.)
- **Descripción**: Resumen de los cambios realizados

Ejemplo:
```
feat: add new income entry form

- Add date picker for entry date
- Validate import amount > 0
- Auto-calculate monthly totals
```
