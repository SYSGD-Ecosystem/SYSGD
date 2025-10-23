# Gemini Agent Inteligente - Generación de Imágenes Reales

## Descripción
Este agente inteligente basado en Gemini AI analiza las peticiones de los usuarios y **genera imágenes reales** usando la API de Gemini. El sistema funciona con el flujo correcto:

1. **Análisis** de la petición para determinar la intención del usuario
2. **Routing inteligente**: texto → modelo de texto, imagen → modelo de imágenes
3. **Generación real** de imágenes con Gemini y subida automática a S3
4. **Respuesta**: Devuelve texto o URL de la imagen generada

## API Endpoints

Para verificar que funciona correctamente:
```bash
# Ejecutar verificación rápida
./verify-gemini-agent.sh
# Ejecutar pruebas completas actualizadas
./test-gemini-updated.sh

# O manualmente
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \

**Respuesta:**
```json
{
  "analysis": {
    "type": "text",
    "confidence": 0.9,
    "reasoning": "Pregunta informativa que requiere respuesta de texto"
  },
  "prompt": "¿Qué es la inteligencia artificial?"
}
```

## Ejemplos de Uso

### Petición de Texto
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es la inteligencia artificial?"}'
```

**Respuesta detectada:** `text`
**Confianza:** 0.9
**Model usado:** gemini-1.5-flash
**Respuesta:** Texto explicativo completo

### Petición de Imagen
```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crea una imagen de un gato robot en una ciudad futurista"}'
```

**Respuesta detectada:** `image`
**Confianza:** 0.95
**Model usado:** gemini-2.5-flash-image
**Respuesta:** URL de la imagen generada en S3

## Modelos Utilizados

### Modelos de Gemini

- `gemini-1.5-flash` - Análisis rápido y preciso de la intención del usuario

**Para generación de texto:**
- `gemini-1.5-flash` - Respuestas de texto rápidas y de alta calidad

**Para Amazon S3 (generación de imágenes):**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
S3_BUCKET=sysgd-images
  "type": "text|image",
  "confidence": 0.0-1.0,
  "reasoning": "explicación"
}
```

#### Generador de Texto
- Tono profesional y amigable
- Respuestas informativas y estructuradas
- Ideal para preguntas, análisis y explicaciones

#### Generador de Imágenes
- **Modelo:** `gemini-2.5-flash-image`
- **Propósito:** Crear imágenes reales usando Gemini AI
- **Características:**
  - Genera imágenes visuales reales, no descripciones
  - Sube automáticamente a Amazon S3
  - Devuelve URL pública de la imagen generada
  - Soporta cualquier tipo de imagen: paisajes, personajes, abstracto, etc.
  - Integración automática con el sistema de chat

## Configuración

### Variables de Entorno

**Para Gemini API:**
```env
GEMINI_API_KEY=tu_clave_de_api_aquí
```

**Para Amazon S3 (generación de imágenes):**
```env
AWS_ENDPOINT=http://localhost:9000  # Para S3 local/compatible
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=sysgd-uploads
```

**Nota:** El sistema usa AWS SDK v2 con configuración idéntica a `upload.controller.ts` (compatible con MinIO/S3 local)

### Verificación

Para verificar que funciona correctamente:
```bash
# Ejecutar verificación rápida
./verify-gemini-agent.sh

# Ejecutar pruebas completas actualizadas
./test-gemini-updated.sh

}
```

## Integración con el Frontend

El agente es compatible con el sistema de agentes existente. Simplemente actualiza la URL del agente a:
```
http://localhost:3000/api/generate
```

### Ejemplo de Uso en Chat
```javascript
// El frontend envía la petición normal
const response = await fetch('/api/agents/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    agent_id: 'agent-id',
    conversation_id: 'conv-id',
    content: 'Crea una imagen de un dragón volando sobre un castillo'
  })
});

// El backend enruta automáticamente al agente inteligente
// que detecta que es una petición de imagen y genera la imagen real

// Respuesta del backend:
{
  "respuesta": "http://localhost:9000/sysgd-uploads/generated-images/uuid.png",
  "metadata": {
    "type": "image",
    "model": "gemini-2.5-flash-image",
    "confidence": 0.95
  }
}

// El frontend puede mostrar la imagen directamente usando la URL
const imageUrl = response.respuesta;
messageElement.innerHTML = `<img src="${imageUrl}" alt="Imagen generada" />`;
```

## Logs y Debugging

El sistema incluye logging detallado:
- 🤖 Procesamiento iniciado
- 📊 Análisis de la petición
- ✅ Respuesta generada con metadata

### Ejemplo de Log
```
🤖 Gemini Agent procesando: Crea una imagen de un paisaje montañoso
📊 Análisis de la petición: {
  type: 'image',
  confidence: 0.95,
  reasoning: 'El usuario pidió explícitamente crear una imagen'
}
🎨 Generando imagen con Gemini: Crea una imagen de un paisaje montañoso
📊 Respuesta de Gemini: [object Object]
✅ Imagen subida a S3: http://localhost:9000/sysgd-uploads/generated-images/uuid.png
✅ Gemini Agent respuesta generada: {
  type: 'image',
  model: 'gemini-2.5-flash-image',
  length: 245
}
```

## Ventajas del Sistema

1. **Experiencia Unificada**: El usuario no necesita especificar el tipo de respuesta
2. **Detección Automática**: Usa IA para entender la intención del usuario
3. **Generación Real de Imágenes**: Crea imágenes reales con Gemini y las sube a S3
4. **Transparencia**: Proporciona metadata sobre la decisión tomada
5. **Escalabilidad**: Fácil agregar nuevos tipos de respuesta en el futuro

## Próximas Mejoras

- [ ] Soporte para audio y video
- [ ] Análisis de archivos adjuntos
- [ ] Modelos especializados por dominio
- [ ] Caching de análisis frecuentes
- [ ] Métricas de precisión del analizador
