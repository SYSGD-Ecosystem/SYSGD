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
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Estructura del Proyecto

- `build.gradle` - Configuración global de Gradle
- `app/build.gradle` - Configuración del módulo app
- `gradle/wrapper/` - Gradle Wrapper 8.5

## Requisitos

- Java 17 (no usar Java 21)
- Android SDK Platform 34
- Gradle 8.5 (incluido via wrapper)
