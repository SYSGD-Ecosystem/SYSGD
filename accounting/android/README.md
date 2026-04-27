# SYSGD Cont

Aplicación Android para el registro de ingresos y gastos de Trabajadores por Cuenta Propia (TCP) en Cuba.

## Descripción

Sistema de registro obligatorio establecido por el Ministerio de Finanzas y Precios (MFP) para efectos fiscales en Cuba.

## Requisitos

- Java 17
- Android SDK Platform 34
- Gradle 8.5

## Compilación

```bash
# Configurar Java 17
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk

# Compilar APK Debug
./gradlew assembleDebug
```

El APK se genera en: `app/build/outputs/apk/debug/app-debug.apk`

## Instalación

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Estructura del Proyecto

```
android/
├── app/
│   ├── build.gradle
│   └── src/main/
│       ├── AndroidManifest.xml
│       └── ...
├── build.gradle
├── gradle/wrapper/
│   ├── gradle-wrapper.properties
│   └── gradle-wrapper.jar
├── gradlew
└── settings.gradle
```
