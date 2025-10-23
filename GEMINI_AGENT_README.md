# Gemini Agent Inteligente - Generación de Imágenes Reales

## Descripción
Este agente inteligente basado en Gemini AI analiza las peticiones de los usuarios y **genera imágenes reales** usando la API de Gemini. El sistema funciona con el flujo correcto:

1. **Análisis**: El sistema analiza el prompt usando un modelo especializado
2. **Clasificación**: Determina si es texto o imagen con un nivel de confianza
3. **Routing**:
   - **Texto**: Envía a modelo de texto de Gemini
4. **Respuesta**: Devuelve texto o URL de la imagen generada

## API Endpoints

Para verificar que funciona correctamente:
```bash
# Ejecutar verificación rápida
./verify-gemini-agent.sh

# Ejecutar pruebas completas (Replicate + S3)
./test-replicate-s3.sh

# O manualmente
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "¿Qué es la inteligencia artificial?"}'
```

**Respuesta esperada para texto:**
```json
{
  "respuesta": "La inteligencia artificial es una rama de la ciencia computacional que se enfoca en la creación de máquinas que pueden realizar tareas que normalmente requieren inteligencia humana, como el razonamiento, el aprendizaje y la percepción.",
  "metadata": {
    "type": "text",
    "model": "gemini-1.5-flash",
    "confidence": 0.9,
    "reasoning": "El usuario pidió explícitamente crear un texto"

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
- Tono profesional y amigable
- Respuestas informativas y estructuradas
- Ideal para preguntas, análisis y explicaciones

#### Generador de Imágenes
- **Modelo:** `google/imagen-4` (via Replicate) - Modelo especializado en crear imágenes reales
- **Propósito:** Crear imágenes reales usando Replicate y subirlas a S3
- **Características:**
  - Genera imágenes visuales reales usando Replicate
  - Descarga automáticamente la imagen desde Replicate
  - Sube a Amazon S3 con la misma configuración que upload.controller.ts
  - Devuelve URL pública de la imagen en S3
  - Soporta cualquier tipo de imagen: paisajes, personajes, abstracto, etc.

### Variables de Entorno

**Para Replicate API (generación de imágenes):**
```env
REPLICATE_API_TOKEN=tu_token_de_replicate_aquí
```

**Para Amazon S3 (almacenamiento de imágenes generadas):**
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
    "model": "replicate-google-imagen-4",
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
🎨 Generando imagen con Replicate: Crea una imagen de un paisaje montañoso
📤 Enviando a Replicate...
📥 Respuesta de Replicate: [object Object]
🔄 Descargando y subiendo a S3...
✅ Imagen subida a S3: http://localhost:9000/sysgd-uploads/generated-images/uuid.png
✅ Gemini Agent respuesta generada: {
  type: 'image',
  model: 'replicate-google-imagen-4',
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
