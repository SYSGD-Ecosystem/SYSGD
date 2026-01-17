export const modules = [
  {
    id: "1",
    name: "Gestión Documental",
    description:
      "Sistema completo para la gestión de archivos documentales con entrada, salida y préstamo de documentos.",
    status: "completed" as const,
    features: [
      "Registros de Entrada, salida y préstamo de documentos",
      "Cuadro de Clasificación Documental",
      "Tablas de Retención Documental",
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
      "Control de acceso a proyectos",
      "Seguimiento de progreso",
      "Editor de tareas con soporte Markdown",
      "Soporte para mejora de creación de tareas con IA",
      "Carga de imágenes en tareas",
      "Integración de Proyectos con GitHub",
      "Banco de ideas y Notas"
    ],
  },
  {
    id: "3",
    name: "Modulo de Chat con soporte para agentes de IA",
    description:
      "Sistema de comunicación en tiempo real integrado con la gestión de proyectos para colaboración del equipo, con soporte para agentes de inteligencia artificial.",
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
