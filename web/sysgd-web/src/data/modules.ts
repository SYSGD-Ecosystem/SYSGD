export const modules = [
  {
    id: "1",
    name: "Gestión Documental",
    description:
      "Sistema completo para la gestión de archivos documentales con entrada, salida y préstamo de documentos.",
    status: "completed" as const,
    features: [
      "Entrada, salida y préstamo de documentos",
      "Cuadro de Clasificación Documental configurable",
      "Tablas de Retención Documental",
      "Búsqueda avanzada y filtros",
      "Historial de movimientos documentales",
    ],
  },
  {
    id: "2",
    name: "Gestión de Proyectos",
    description: "Módulo para administrar proyectos, tareas, usuarios y roles dentro de la organización.",
    status: "in-progress" as const,
    features: [
      "Gestión de usuarios y roles",
      "Sistema de invitaciones",
      "Asignación dinámica de tareas con tipos y estados configurables",
      "Control de acceso por permisos",
      "Seguimiento de progreso",
      "Editor de tareas con soporte Markdown",
      "Carga de imágenes en tareas",
    ],
  },
  {
    id: "3",
    name: "Chat para Equipos",
    description:
      "Sistema de comunicación en tiempo real integrado con la gestión de proyectos para colaboración del equipo.",
    status: "in-progress" as const,
    features: [
      "Chat en tiempo real entre miembros del equipo",
      "Integración con gestión de proyectos",
      "Soporte para agentes de inteligencia artificial",
      "Comunicación contextual por proyecto",
      "Historial de conversaciones",
    ],
  },
]
