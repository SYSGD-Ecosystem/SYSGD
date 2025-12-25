# Sistema de Agentes para SYSGD-CHAT

## Descripción

El sistema de agentes permite a los usuarios crear y gestionar agentes de IA personalizados que se integran directamente con el sistema de chat. Los agentes pueden procesar diferentes tipos de contenido (texto, imágenes, audio, video) y responder a través de endpoints personalizados.

## Características

- ✅ **Creación de Agentes**: Los usuarios pueden crear agentes con nombre, URL y tipos de soporte
- ✅ **Gestión de Agentes**: Activar/desactivar, editar y eliminar agentes
- ✅ **Integración en Chat**: Los agentes se integran directamente en las conversaciones
- ✅ **Soporte Multi-media**: Los agentes pueden procesar texto, imágenes, audio y video
- ✅ **Interfaz Intuitiva**: Barra de herramientas vertical con modales para gestión
- ✅ **API RESTful**: Endpoints completos para CRUD de agentes

## Estructura de la Base de Datos

### Tabla `agents`
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  support TEXT[] NOT NULL DEFAULT '{}', -- Array de tipos soportados
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla `agent_conversations`
```sql
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(conversation_id, agent_id)
);
```

## API Endpoints

### Agentes
- `POST /api/agents` - Crear agente
- `GET /api/agents` - Listar agentes del usuario
- `GET /api/agents/:id` - Obtener agente por ID
- `PUT /api/agents/:id` - Actualizar agente
- `DELETE /api/agents/:id` - Eliminar agente
- `POST /api/agents/message` - Enviar mensaje a agente

### Estructura de Datos

#### Crear Agente
```typescript
interface CreateAgentRequest {
  name: string;
  url: string;
  support: AgentSupport[]; // ['text', 'image', 'audio', 'video']
  description?: string;
}
```

#### Enviar Mensaje a Agente
```typescript
interface AgentMessageRequest {
  agent_id: string;
  conversation_id: string;
  content: string;
  attachment_type?: 'image' | 'audio' | 'video' | 'file';
  attachment_url?: string;
}
```

## Protocolo de Comunicación con Agentes

Los agentes deben implementar un endpoint que acepte peticiones POST con el siguiente formato:

### Petición al Agente
```json
{
  "prompt": "Mensaje de texto del usuario",
  "image": "URL_de_imagen", // Solo si attachment_type es 'image'
  "audio": "URL_de_audio",  // Solo si attachment_type es 'audio'
  "video": "URL_de_video",  // Solo si attachment_type es 'video'
  "file": "URL_de_archivo"  // Solo si attachment_type es 'file'
}
```

### Respuesta del Agente
```json
{
  "respuesta": "Respuesta del agente",
  "response": "Respuesta alternativa", // Campo alternativo
  "message": "Mensaje alternativo"     // Campo alternativo
}
```

## Uso en el Frontend

### 1. Crear un Agente
1. Abrir el chat
2. Hacer clic en el botón "Crear Agente" en la barra de herramientas
3. Completar el formulario:
   - **Nombre**: Nombre descriptivo del agente
   - **URL**: Endpoint del agente (debe ser HTTPS)
   - **Soporte**: Seleccionar tipos de contenido soportados
   - **Descripción**: Descripción opcional

### 2. Gestionar Agentes
1. Hacer clic en "Agentes" en la barra de herramientas
2. Ver lista de agentes con opciones para:
   - Activar/Desactivar
   - Usar en conversación
   - Eliminar

### 3. Usar un Agente en Chat
1. Seleccionar un agente desde la lista
2. El agente aparecerá como "activo" en la interfaz de chat
3. Enviar mensajes normalmente - serán procesados por el agente
4. El agente responderá automáticamente

## Componentes del Frontend

### Hooks
- `useAgents()` - Hook principal para gestión de agentes
- `useChat()` - Hook existente para mensajes (extendido)

### Componentes
- `ChatToolbar` - Barra de herramientas vertical
- `CreateAgentModal` - Modal para crear agentes
- `AgentsListModal` - Modal para gestionar agentes
- `ChatConversation` - Componente de chat (extendido para agentes)

## Seguridad

- Los agentes solo son accesibles por su creador
- Validación de URLs en el frontend y backend
- Autenticación requerida para todas las operaciones
- Sanitización de datos de entrada

## Limitaciones Actuales

- Los agentes no pueden ser compartidos entre usuarios
- No hay sistema de plantillas para agentes
- No hay métricas de uso de agentes
- No hay sistema de versionado de agentes

## Próximas Mejoras

- [ ] Sistema de plantillas de agentes
- [ ] Métricas y analytics de uso
- [ ] Compartir agentes entre usuarios
- [ ] Sistema de versionado
- [ ] Agentes predefinidos del sistema
- [ ] Integración con webhooks
- [ ] Sistema de logs de conversaciones con agentes

## Ejemplo de Agente Simple

```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/agent', methods=['POST'])
def process_message():
    data = request.get_json()
    
    prompt = data.get('prompt', '')
    image = data.get('image')
    
    # Procesar el mensaje
    if image:
        response = f"Procesé la imagen y el texto: {prompt}"
    else:
        response = f"Procesé el texto: {prompt}"
    
    return jsonify({
        "respuesta": response
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

## Soporte

Para reportar problemas o solicitar nuevas características, crear un issue en el repositorio del proyecto.
