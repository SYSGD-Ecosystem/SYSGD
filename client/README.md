# SYSGD
Sistema de Gestión Documental

## Instalar dependencias
```bash
npm install
```

## Compilar app
```bash
npm run build
```

## Instalar en Android por WiFi

1. Conectar el teléfono por USB y habilitar "Depuración USB" en opciones de desarrollador
2. Ejecutar:
```bash
adb tcpip 5555
```

3. Obtener la IP del teléfono (Configuración → WiFi → Red conectada → IP)

4. Conectar por WiFi:
```bash
adb connect <IP_DEL_TELEFONO>:5555
```

5. Instalar la app:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk && npx cap run android
```

## Notas
- La URL del servidor se configura en el archivo `.env`
- Verificar que el teléfono y la PC estén en la misma red WiFi
