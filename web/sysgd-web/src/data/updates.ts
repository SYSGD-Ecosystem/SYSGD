export const updates = [
  {
    id: "6",
    date: "2025-12-22",
    title: "Integración con GitHub para Rastreo de Actividad",
    description:
      "Nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests: usuario creador, líneas añadidas/eliminadas y archivos modificados. Ideal para empresas y pequeños equipos que necesitan rastrear el nivel de actividad real de cada desarrollador. Cada usuario debe configurar su propio Personal Access Token en GitHub (Settings > Developer settings > Personal access tokens > Generate new token con permisos 'repo'). El sistema está optimizado para memoria, previniendo recargas innecesarias - usa el botón de recarga manual para actualizar datos. Incluye exportación a Excel para análisis externo.",
    category: "Nueva Funcionalidad",
  },
  {
    id: "7",
    date: "2025-12-22",
    title: "Dinamización de Tareas y Editor Mejorado",
    description:
      "Estamos trabajando en hacer las tareas más flexibles permitiendo asignar tipos, estados y otros elementos de forma dinámica en lugar de fija. Para ello se habilitó una nueva página de ajustes. También implementamos mejoras sustanciales en el editor de tareas: ahora soporta Markdown para formateo rico de texto y permite subir imágenes directamente a las tareas, mejorando significativamente la documentación y comunicación del trabajo.",
    category: "Mejora",
  },
  {
    id: "1",
    date: "2025-12-21",
    title: "Lanzamiento de la Página Institucional",
    description:
      "Hemos lanzado la página institucional pública de SYSGD Ecosystem. Este espacio permitirá a la comunidad seguir el progreso del proyecto, conocer el roadmap y mantenerse actualizado con las últimas novedades del desarrollo.",
    category: "Anuncio",
    // screenshots: ["/institutional-website-homepage.jpg", "/roadmap-page-design.jpg"],
  },
  {
    id: "2",
    date: "2025-12-15",
    title: "Sistema de Créditos SYSGD-COINS",
    description:
      "Implementamos el sistema de créditos SYSGD-COINS que permite a los usuarios utilizar funciones potenciadas con IA generativa. Cada usuario nuevo recibe 10 monedas para experimentar las mejoras automatizadas. El sistema está integrado con Gemini AI para proporcionar capacidades avanzadas de procesamiento.",
    category: "Nueva Funcionalidad",
  },
  {
    id: "3",
    date: "2025-12-01",
    title: "Mejoras en el Módulo de Gestión de Proyectos",
    description:
      "Actualización importante del módulo de gestión de proyectos con nuevas funcionalidades: asignación masiva de tareas, vista de calendario, y notificaciones mejoradas. También optimizamos el rendimiento de las consultas para proyectos con gran cantidad de tareas.",
    category: "Mejora",
  },
  {
    id: "4",
    date: "2025-11-20",
    title: "Documentación de API Actualizada",
    description:
      "Hemos actualizado completamente la documentación de la API RESTful con Swagger. Ahora incluye ejemplos más detallados, códigos de error mejorados y guías de integración para desarrolladores. La documentación interactiva facilita probar todos los endpoints directamente desde el navegador.",
    category: "Documentación",
  },
  {
    id: "5",
    date: "2025-11-05",
    title: "Refactorización del Sistema de Autenticación",
    description:
      "Completamos una refactorización importante del sistema de autenticación para mejorar la seguridad y el rendimiento. Implementamos mejores prácticas con bcrypt para el cifrado de contraseñas, sesiones más eficientes con Passport, y soporte mejorado para Google OAuth2.",
    category: "Seguridad",
  },
]
