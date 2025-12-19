# SYSGD Electron App

Aplicación de escritorio basada en Electron para el proyecto SYSGD (Sistema de Gestión de Documentos).

## Descripción

Esta aplicación Electron proporciona una interfaz de escritorio para el sistema SYSGD, permitiendo ejecutar la aplicación web en un entorno nativo con acceso a las APIs del sistema operativo.

## Requisitos del Sistema

- Node.js (versión 16 o superior)
- npm o yarn
- Sistema operativo: Windows, macOS o Linux

## Instalación

1. Clonar el repositorio y navegar a la carpeta `electron`:
```bash
cd electron
```

2. Instalar las dependencias:
```bash
npm install
```

## Desarrollo

Para iniciar la aplicación en modo de desarrollo:

```bash
npm run dev
```

Este comando iniciará la aplicación Electron y se conectará al servidor de desarrollo del frontend (generalmente ejecutándose en `http://localhost:5173`).

## Producción

Para construir la aplicación para distribución:

```bash
npm run dist
```

Este comando generará los ejecutables para el sistema operativo actual:
- **Linux**: AppImage y paquete .deb
- **Windows**: Instalador .exe
- **macOS**: Aplicación .dmg

## Configuración

### Archivos Principales

- `main.js`: Proceso principal de Electron, gestiona la ventana de la aplicación
- `package.json`: Configuración del proyecto y dependencias
- `preload.js`: Script de precarga (opcional, para comunicación segura entre procesos)

### Configuración de Producción

Para desplegar en producción, descomenta la línea 17 en `main.js`:

```javascript
// Para producción:
win.loadFile(path.join(__dirname, '../client/dist/index.html'));
```

Y comenta la línea de desarrollo:

```javascript
// win.loadURL('http://localhost:5173'); // si usas vite en modo dev
```

## Scripts Disponibles

- `npm run dev`: Inicia la aplicación en modo desarrollo
- `npm run dist`: Construye la aplicación para distribución
- `npm start`: Inicia la aplicación (equivalente a `npm run dev`)

## Splash Screen

La aplicación incluye un splash screen personalizado que se muestra durante el inicio:

### Características del Splash Screen
- **Diseño moderno**: Interfaz elegante con animaciones suaves
- **Branding**: Muestra el logo y nombre de SYSGD
- **Animaciones**: Efectos de partículas y barra de progreso
- **Transición**: Cambio automático a la ventana principal cuando está lista
- **Sin bordes**: Ventana sin marco para apariencia más limpia

### Componentes
- `splash.html`: Archivo HTML del splash screen
- `preload.js`: Script de comunicación segura entre procesos
- `main.js`: Lógica de manejo de ventanas y eventos

El splash screen proporciona una experiencia de usuario más profesional mientras la aplicación carga los componentes necesarios.

## Barra de Título Personalizada

La aplicación incluye una barra de título personalizada que reemplaza la barra del sistema:

### Características de la Barra de Título
- **Diseño personalizado**: Sin bordes del sistema, estilo moderno
- **Controles de ventana**: Minimizar, maximizar/restaurar, cerrar
- **Área de arrastre**: Permite mover la ventana arrastrando el título
- **Branding integrado**: Logo y nombre de SYSGD
- **Detección automática**: Solo se activa en modo Electron
- **Estados dinámicos**: Cambia icono según estado maximizado

### Componentes de la Barra de Título
- `src/components/TitleBar.tsx`: Componente React con controles
- `src/types/electron.d.ts`: Tipos TypeScript para la API
- `preload.js`: APIs expuestas para control de ventana
- `main.js`: Configuración de ventana sin bordes

### Funcionalidades
- **Minimizar**: Reduce la ventana a la barra de tareas
- **Maximizar/Restaurar**: Alterna entre pantalla completa y tamaño normal
- **Cerrar**: Cierra la aplicación completamente
- **Arrastre**: Mueve la ventana al arrastrar el área del título

La barra de título personalizada proporciona una apariencia moderna y consistente en todas las plataformas.

## ElectronWrapper - Wrapper Universal

Para manejar la barra de título en toda la aplicación, se ha implementado un wrapper inteligente:

### Características del ElectronWrapper
- **Detección automática**: Identifica si la aplicación corre en Electron
- **Wrapper condicional**: Solo aplica la barra de título en entorno Electron
- **Cobertura total**: Envuelve toda la aplicación incluyendo todas las rutas
- **Sin impacto en web**: En navegador funciona normalmente sin barra de título
- **Layout flexible**: Mantiene el diseño responsive en todos los entornos

### Componentes del Wrapper
- `src/components/ElectronWrapper.tsx`: Wrapper principal con detección de entorno
- Integrado en `src/main.tsx` para cubrir toda la aplicación
- Compatible con `AppRouter` y `ThemeProvider`

### Funcionamiento
```typescript
// En Electron: muestra barra de título + contenido
<ElectronWrapper>
  <TitleBar />
  <div className="flex-1">
    {children} // Toda la app
  </div>
</ElectronWrapper>

// En Web: solo el contenido
<ElectronWrapper>
  {children} // Toda la app sin barra
</ElectronWrapper>
```

Este enfoque garantiza que la barra de título esté presente en **todas las páginas** cuando se ejecuta en Electron, mientras que en el navegador web funciona normalmente.

## Arquitectura

La aplicación sigue la arquitectura estándar de Electron:

- **Proceso Principal**: Gestiona el ciclo de vida de la aplicación y crea ventanas
- **Proceso de Renderer**: Ejecuta la interfaz de usuario (contenido web)
- **Comunicación**: Entre procesos principales y de renderer a través de IPC

## Personalización

### Tamaño de Ventana
Puedes ajustar el tamaño de la ventana en `main.js` modificando las propiedades `width` y `height`:

```javascript
var win = new BrowserWindow({
    width: 1200,  // Ancho en píxeles
    height: 800,  // Alto en píxeles
    // ... otras configuraciones
});
```

### Icono de Aplicación
La aplicación ya incluye un icono personalizado en `assets/icon.png` (copiado del frontend). 

**Configuración aplicada:**
- Icono añadido a la ventana principal en `main.js`
- Configurado para todos los sistemas operativos en `package.json`
- Incluido en los archivos de distribución

El icono se mostrará:
- En la barra de título de la ventana
- En el dock/panel de aplicaciones
- En los ejecutables generados

## Solución de Problemas

### Aplicación no se inicia
- Verifica que Node.js esté instalado correctamente
- Asegúrate de haber instalado todas las dependencias con `npm install`
- Revisa que el servidor de desarrollo del frontend esté corriendo

### Error de conexión
- Asegúrate de que el servidor frontend esté corriendo en el puerto especificado
- Verifica que no haya otro proceso usando el mismo puerto

## Licencia

ISC License
