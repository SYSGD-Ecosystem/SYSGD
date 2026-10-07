// ARCHIVO GENERADO — no editar a mano.
// Regenerar:  node server/scripts/extract-api-params.js
//
// Extrae del servidor (server/src/routes + controllers + services) los parametros que
// espera cada endpoint: los de la ruta, los de query, los del body (destructuring, casts
// a interfaces TypeScript y esquemas zod) y los middlewares de autorizacion.
//
// Un parametro solo aparece como "obligatorio" si el servidor lo comprueba y responde
// 400/422, o si el esquema zod lo declara sin .optional(). Los tipos vienen del codigo:
// son fiables como referencia, pero el contrato definitive es el servidor.

export interface ApiParamDoc {
  /** nombre real del parametro tal y como lo usa el servidor */
  name: string;
  /** donde viaja */
  in: "path" | "query" | "body";
  /** tipo segun el codigo (string, number, boolean, array, object, enum(...), date...) */
  type: string;
  required: boolean;
  /** limite o validacion detectada: min, max, email, uuid/url... */
  constraint?: string;
  /** valor por defecto si el servidor lo define */
  default?: string;
  /** de donde sale el dato: "validacion (400/422)", "esquema zod X", "interfaz X" */
  source?: string;
}

export interface ApiEndpointDoc {
  method: string;
  /** ruta real con los nombres de parametro del servidor */
  path: string;
  /** clave de busqueda: metodo + ruta normalizada (para emparejar con la ayuda) */
  key: string;
  /** middlewares de la ruta: isAuthenticated, hasWorkspaceAccess, checkTaskLimit... */
  auth: string[];
  /** true si la ruta vive en el router legacy routes/api.ts (deprecated) */
  legacy: boolean;
  params: ApiParamDoc[];
}

const DOCS: ApiEndpointDoc[] = [
 {
  "method": "GET",
  "path": "/accounting-documents",
  "key": "GET /accounting-documents",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/accounting-documents",
  "key": "POST /accounting-documents",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/accounting-documents/:id",
  "key": "GET /accounting-documents/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/accounting-documents/:id",
  "key": "PUT /accounting-documents/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "payload",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/accounting-documents/pdf/tcp",
  "key": "POST /accounting-documents/pdf/tcp",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "payload",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add_classification_data",
  "key": "POST /add_classification_data",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add-document-entry",
  "key": "POST /add-document-entry",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add-document-exit",
  "key": "POST /add-document-exit",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add-document-loan",
  "key": "POST /add-document-loan",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add-document-topographic",
  "key": "POST /add-document-topographic",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/add-retention-schedule",
  "key": "POST /add-retention-schedule",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/admin/analytics",
  "key": "GET /admin/analytics",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "period",
    "in": "query",
    "type": "string",
    "required": false
   },
   {
    "name": "anchor",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/admin/metrics",
  "key": "GET /admin/metrics",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/admin/users",
  "key": "GET /admin/users",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "page",
    "in": "query",
    "type": "string",
    "required": false
   },
   {
    "name": "pageSize",
    "in": "query",
    "type": "string",
    "required": false
   },
   {
    "name": "q",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/admin/users",
  "key": "POST /admin/users",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "privileges",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/admin/users/:id",
  "key": "DELETE /admin/users/:p",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/admin/users/:id",
  "key": "PUT /admin/users/:p",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "privileges",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/agents",
  "key": "GET /agents",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/agents",
  "key": "POST /agents",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "url",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "support",
    "in": "body",
    "type": "array",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "is_public",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/agents/:id",
  "key": "DELETE /agents/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/agents/:id",
  "key": "GET /agents/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/agents/:id",
  "key": "PUT /agents/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "updates",
    "in": "body",
    "type": "array/object",
    "required": false
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "url",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "support",
    "in": "body",
    "type": "array",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "is_active",
    "in": "body",
    "type": "boolean",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   },
   {
    "name": "is_public",
    "in": "body",
    "type": "boolean",
    "required": false,
    "source": "interfaz UpdateAgentRequest"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/agents/message",
  "key": "POST /agents/message",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "agent_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "conversation_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "content",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "attachment_type",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "attachment_url",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/agents/public",
  "key": "GET /agents/public",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "q",
    "in": "query",
    "type": "string",
    "required": false
   },
   {
    "name": "support",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/ai/completions",
  "key": "POST /ai/completions",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "provider",
    "in": "body",
    "type": "object",
    "required": false
   },
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "rawRequestId",
    "in": "body",
    "type": "array/object",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/ai/models",
  "key": "GET /ai/models",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/archives",
  "key": "GET /archives",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": []
 },
 {
  "method": "DELETE",
  "path": "/archives/:id",
  "key": "DELETE /archives/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/archives/:id",
  "key": "PUT /archives/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "code",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "company",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/auth/2fa/status",
  "key": "GET /auth/2fa/status",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/auth/2fa/status",
  "key": "PUT /auth/2fa/status",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "enabled",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/auth/account",
  "key": "DELETE /auth/account",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/check-user",
  "key": "POST /auth/check-user",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/complete-registration",
  "key": "POST /auth/complete-registration",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "userId",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/external-token",
  "key": "POST /auth/external-token",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/auth/login",
  "key": "POST /auth/login",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/logout",
  "key": "POST /auth/logout",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/auth/me",
  "key": "GET /auth/me",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/auth/password",
  "key": "PUT /auth/password",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "currentPassword",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "newPassword",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/resend-2fa",
  "key": "POST /auth/resend-2fa",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "twoFactorToken",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/auth/verify-2fa",
  "key": "POST /auth/verify-2fa",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "twoFactorToken",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "code",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/chat/conversations",
  "key": "GET /chat/conversations",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "DELETE",
  "path": "/chat/conversations/:conversationId",
  "key": "DELETE /chat/conversations/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/chat/conversations/:conversationId",
  "key": "PUT /chat/conversations/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/chat/conversations/:conversationId/members",
  "key": "POST /chat/conversations/:p/members",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "user_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/chat/conversations/:conversationId/members/:userId",
  "key": "DELETE /chat/conversations/:p/members/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "userId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/chat/conversations/:conversationId/read",
  "key": "POST /chat/conversations/:p/read",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "last_read_message_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/chat/conversations/create",
  "key": "POST /chat/conversations/create",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "contactemail",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "members",
    "in": "body",
    "type": "array",
    "required": false
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "type",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "agent_id",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/chat/conversations/invitations",
  "key": "GET /chat/conversations/invitations",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/chat/conversations/invite",
  "key": "POST /chat/conversations/invite",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversation_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "receiver_email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/chat/conversations/invite/accept",
  "key": "POST /chat/conversations/invite/accept",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "invitation_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/chat/conversations/user/:userId",
  "key": "GET /chat/conversations/user/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "userId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/chat/invites/validate/:token",
  "key": "GET /chat/invites/validate/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/chat/messages/:conversationId",
  "key": "GET /chat/messages/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversationId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/chat/messages/:messageId",
  "key": "DELETE /chat/messages/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "messageId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/chat/messages/send",
  "key": "POST /chat/messages/send",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "conversation_id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "content",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "attachment_type",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "attachment_url",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "reply_to",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-ledger",
  "key": "GET /cont-ledger",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/cont-ledger",
  "key": "PUT /cont-ledger",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "registro",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "inventarioRegistro",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "activeWorkspaceId",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "workspaces",
    "in": "body",
    "type": "array",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "inventario",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-turnos/:id/informe-disponibilidad",
  "key": "GET /cont-turnos/:p/informe-disponibilidad",
  "auth": [
   "hasWorkspaceAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/cont-turnos/:id/informe-disponibilidad",
  "key": "PUT /cont-turnos/:p/informe-disponibilidad",
  "auth": [
   "hasWorkspaceAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "informe",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "informeId",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "huella",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "generadoEn",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-turnos/:id/reportes-turno",
  "key": "GET /cont-turnos/:p/reportes-turno",
  "auth": [
   "hasWorkspaceAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "estado",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/cont-turnos/:id/reportes-turno",
  "key": "POST /cont-turnos/:p/reportes-turno",
  "auth": [
   "hasWorkspaceAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "informeOrigenId",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "informeOrigenGeneradoEn",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "vendedorId",
    "in": "body",
    "type": "object",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "vendedorNombre",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "turnoId",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "fechaTurno",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "generadoEn",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "paquete",
    "in": "body",
    "type": "cualquiera",
    "required": false,
    "source": "tipo en linea"
   }
  ]
 },
 {
  "method": "PATCH",
  "path": "/cont-turnos/:id/reportes-turno/:reporteId",
  "key": "PATCH /cont-turnos/:p/reportes-turno/:p",
  "auth": [
   "hasWorkspaceAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "reporteId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "estado",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   },
   {
    "name": "nota",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "tipo en linea"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-workspaces",
  "key": "GET /cont-workspaces",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/cont-workspaces",
  "key": "POST /cont-workspaces",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/cont-workspaces/:id",
  "key": "DELETE /cont-workspaces/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-workspaces/:id",
  "key": "GET /cont-workspaces/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-workspaces/:id/ledger",
  "key": "GET /cont-workspaces/:p/ledger",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/cont-workspaces/:id/ledger",
  "key": "PUT /cont-workspaces/:p/ledger",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "expectedVersion",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "registro",
    "in": "body",
    "type": "array/object",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-workspaces/:id/members",
  "key": "GET /cont-workspaces/:p/members",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/cont-workspaces/:id/members/:userId",
  "key": "DELETE /cont-workspaces/:p/members/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "userId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PATCH",
  "path": "/cont-workspaces/:id/members/:userId",
  "key": "PATCH /cont-workspaces/:p/members/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "userId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "role",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/cont-workspaces/:id/members/invite",
  "key": "POST /cont-workspaces/:p/members/invite",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "email",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/cont-workspaces/:id/name",
  "key": "PUT /cont-workspaces/:p/name",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "name",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/cont-workspaces/:id/vendedores/:vendedorId/link",
  "key": "DELETE /cont-workspaces/:p/vendedores/:p/link",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "vendedorId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/cont-workspaces/:id/vendedores/:vendedorId/link",
  "key": "PUT /cont-workspaces/:p/vendedores/:p/link",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "vendedorId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "memberUserId",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "almacenId",
    "in": "body",
    "type": "object",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/cont-workspaces/:id/vendedores/links",
  "key": "GET /cont-workspaces/:p/vendedores/links",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/create",
  "key": "POST /create",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "company",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "code",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/allowance/:address",
  "key": "GET /crypto-payments/allowance/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "address",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/balance/:address",
  "key": "GET /crypto-payments/balance/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "address",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/faucet/cooldown/:address",
  "key": "GET /crypto-payments/faucet/cooldown/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "address",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/network",
  "key": "GET /crypto-payments/network",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/crypto-payments/orders",
  "key": "GET /crypto-payments/orders",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "limit",
    "in": "query",
    "type": "string",
    "required": false
   },
   {
    "name": "offset",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/crypto-payments/orders",
  "key": "POST /crypto-payments/orders",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "productId",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "walletAddress",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/orders/:orderId",
  "key": "GET /crypto-payments/orders/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "orderId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/products",
  "key": "GET /crypto-payments/products",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/crypto-payments/products/:productId",
  "key": "GET /crypto-payments/products/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "productId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/crypto-payments/service/status",
  "key": "GET /crypto-payments/service/status",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/descubre/admin/posts",
  "key": "GET /descubre/admin/posts",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "limit",
    "in": "query",
    "type": "string",
    "required": false,
    "constraint": "min(limitParam, 500)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/descubre/admin/posts/:id",
  "key": "DELETE /descubre/admin/posts/:p",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/descubre/posts",
  "key": "GET /descubre/posts",
  "auth": [
   "optionalAuth"
  ],
  "legacy": false,
  "params": [
   {
    "name": "cursor",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/descubre/posts",
  "key": "POST /descubre/posts",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "precio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "moneda",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "province",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "contactNumber",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "imageUrls",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/descubre/posts/:id",
  "key": "DELETE /descubre/posts/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/descubre/posts/:id",
  "key": "PUT /descubre/posts/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "precio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "moneda",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "province",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "contactNumber",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "imageUrls",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/descubre/posts/:id/vote",
  "key": "POST /descubre/posts/:p/vote",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/gema",
  "key": "POST /gema",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "image",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "audio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "video",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "file",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/generate",
  "key": "POST /generate",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "image",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "audio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "video",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "file",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/generate/analyze",
  "key": "POST /generate/analyze",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/generate/text",
  "key": "POST /generate/text",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "rawRequestId",
    "in": "body",
    "type": "array/object",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get_data",
  "key": "GET /get_data",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-document-entry",
  "key": "GET /get-document-entry",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-document-exit",
  "key": "GET /get-document-exit",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-document-loan",
  "key": "GET /get-document-loan",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-document-topographic",
  "key": "GET /get-document-topographic",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-organization-chart",
  "key": "GET /get-organization-chart",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/get-retention-schedule",
  "key": "GET /get-retention-schedule",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/metrics",
  "key": "POST /github/metrics",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "owner",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "repo",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/project-config",
  "key": "POST /github/project-config",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "owner",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "repo",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/github/project-config/:projectId",
  "key": "DELETE /github/project-config/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/github/project-config/:projectId",
  "key": "GET /github/project-config/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/pull-requests",
  "key": "POST /github/pull-requests",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "state",
    "in": "query",
    "type": "enum",
    "required": true,
    "source": "zod"
   },
   {
    "name": "sort",
    "in": "query",
    "type": "enum",
    "required": true,
    "source": "zod"
   },
   {
    "name": "direction",
    "in": "query",
    "type": "enum",
    "required": true,
    "source": "zod"
   },
   {
    "name": "dateFrom",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod pullRequestFiltersSchema"
   },
   {
    "name": "dateTo",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod pullRequestFiltersSchema"
   },
   {
    "name": "page",
    "in": "query",
    "type": "number",
    "required": false,
    "constraint": "min 1",
    "default": "1",
    "source": "esquema zod pullRequestFiltersSchema"
   },
   {
    "name": "perPage",
    "in": "query",
    "type": "number",
    "required": false,
    "constraint": "min 1, max 100",
    "default": "50",
    "source": "esquema zod pullRequestFiltersSchema"
   },
   {
    "name": "owner",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "repo",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/repository",
  "key": "POST /github/repository",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "owner",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "repo",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/user-token",
  "key": "POST /github/user-token",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/github/user-token/:projectId",
  "key": "DELETE /github/user-token/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/github/user-token/:projectId/status",
  "key": "GET /github/user-token/:p/status",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/github/validate",
  "key": "POST /github/validate",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "owner",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "repo",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/ideas/:ideaId",
  "key": "DELETE /ideas/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "ideaId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/ideas/:ideaId",
  "key": "PUT /ideas/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "ideaId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "priority",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "implementability",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "impact",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/ideas/:projectId",
  "key": "GET /ideas/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/ideas/:projectId",
  "key": "POST /ideas/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "priority",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "implementability",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "impact",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/invitations",
  "key": "GET /invitations",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/invitations/accept",
  "key": "POST /invitations/accept",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/invitations/verify-token",
  "key": "GET /invitations/verify-token",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "query",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/licenses",
  "key": "GET /licenses",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/licenses/generate",
  "key": "POST /licenses/generate",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "requestCode",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "tier",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/manual-payments/admin/orders",
  "key": "GET /manual-payments/admin/orders",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/manual-payments/admin/orders/:id/review",
  "key": "PUT /manual-payments/admin/orders/:p/review",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "payload",
    "in": "body",
    "type": "array/object",
    "required": false
   },
   {
    "name": "status",
    "in": "body",
    "type": "\"approved\" | \"rejected\"",
    "required": false,
    "source": "opcional en la practica"
   },
   {
    "name": "reviewNotes",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz ReviewManualPaymentOrderInput"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/manual-payments/orders",
  "key": "GET /manual-payments/orders",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/manual-payments/orders",
  "key": "POST /manual-payments/orders",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "payload",
    "in": "body",
    "type": "array/object",
    "required": false
   },
   {
    "name": "productId",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "opcional en la practica"
   },
   {
    "name": "payerPhone",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "opcional en la practica"
   },
   {
    "name": "smsMessage",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "opcional en la practica"
   },
   {
    "name": "confirmationPhoneAcknowledged",
    "in": "body",
    "type": "boolean",
    "required": false,
    "source": "opcional en la practica"
   },
   {
    "name": "receiverPhoneShared",
    "in": "body",
    "type": "boolean",
    "required": false,
    "source": "opcional en la practica"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/manual-payments/products",
  "key": "GET /manual-payments/products",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/me",
  "key": "GET /me",
  "auth": [],
  "legacy": true,
  "params": []
 },
 {
  "method": "GET",
  "path": "/members/:projectId",
  "key": "GET /members/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/members/accept-invite/:invitationId",
  "key": "POST /members/accept-invite/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "invitationId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/members/invite/:projectId",
  "key": "POST /members/invite/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "role",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/members/status",
  "key": "GET /members/status",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/nomenclators/accounting/categories",
  "key": "GET /nomenclators/accounting/categories",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/nomenclators/accounting/search",
  "key": "GET /nomenclators/accounting/search",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "q",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod accountingSearchQuerySchema"
   },
   {
    "name": "categoryCode",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod accountingSearchQuerySchema"
   },
   {
    "name": "subcategoryCode",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod accountingSearchQuerySchema"
   },
   {
    "name": "limit",
    "in": "query",
    "type": "number",
    "required": false,
    "constraint": "min 1, max 200",
    "source": "esquema zod accountingSearchQuerySchema"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/nomenclators/accounting/subcategories",
  "key": "GET /nomenclators/accounting/subcategories",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/nomenclators/cnae/search",
  "key": "GET /nomenclators/cnae/search",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "q",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "esquema zod cnaeSearchQuerySchema"
   },
   {
    "name": "limit",
    "in": "query",
    "type": "number",
    "required": false,
    "constraint": "min 1, max 200",
    "source": "esquema zod cnaeSearchQuerySchema"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/notes/:id",
  "key": "DELETE /notes/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/notes/:id",
  "key": "PUT /notes/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "content",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "esquema zod updateNoteSchema"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/notifications/daily-report",
  "key": "POST /notifications/daily-report",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "to",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "html",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "subject",
    "in": "body",
    "type": "object",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/openrouter",
  "key": "POST /openrouter",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "systemPrompt",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "rawRequestId",
    "in": "body",
    "type": "array/object",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/openrouterai",
  "key": "POST /openrouterai",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "image",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "audio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "video",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "file",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/organization",
  "key": "GET /organization",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "query",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/organization",
  "key": "POST /organization",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/projects",
  "key": "GET /projects",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/projects",
  "key": "POST /projects",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "visibility",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/projects/:id",
  "key": "DELETE /projects/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/projects/:id",
  "key": "GET /projects/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/projects/:id",
  "key": "PUT /projects/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "visibility",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "status",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/projects/:id/notes",
  "key": "GET /projects/:p/notes",
  "auth": [
   "isAuthenticated",
   "hasProjectAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/projects/:id/notes",
  "key": "POST /projects/:p/notes",
  "auth": [
   "isAuthenticated",
   "hasProjectAccess"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "constraint": "min 1",
    "source": "zod"
   },
   {
    "name": "content",
    "in": "body",
    "type": "string",
    "required": false,
    "default": "\"\"",
    "source": "esquema zod createNoteSchema"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/projects/:projectId/create-conversation",
  "key": "POST /projects/:p/create-conversation",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/projects/:projectId/task-config",
  "key": "GET /projects/:p/task-config",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/projects/:projectId/task-config",
  "key": "PUT /projects/:p/task-config",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "task_config",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/projects/:projectId/task-config/priorities",
  "key": "POST /projects/:p/task-config/priorities",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "level",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "color",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/projects/:projectId/task-config/priorities/:priorityName",
  "key": "DELETE /projects/:p/task-config/priorities/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "priorityName",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/projects/:projectId/task-config/states",
  "key": "POST /projects/:p/task-config/states",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "color",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "requires_context",
    "in": "body",
    "type": "boolean",
    "required": false,
    "default": "false"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/projects/:projectId/task-config/states/:stateName",
  "key": "DELETE /projects/:p/task-config/states/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "stateName",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/projects/:projectId/task-config/types",
  "key": "POST /projects/:p/task-config/types",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "color",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/projects/:projectId/task-config/types/:typeName",
  "key": "DELETE /projects/:p/task-config/types/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "projectId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "typeName",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/qwen",
  "key": "POST /qwen",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "image",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "audio",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "video",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "file",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/register",
  "key": "POST /register",
  "auth": [],
  "legacy": true,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/save-organization-chart",
  "key": "POST /save-organization-chart",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": true,
  "params": [
   {
    "name": "id",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "data",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/stats/daily",
  "key": "GET /stats/daily",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "date",
    "in": "query",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/status",
  "key": "GET /status",
  "auth": [],
  "legacy": true,
  "params": []
 },
 {
  "method": "POST",
  "path": "/tasks",
  "key": "POST /tasks",
  "auth": [
   "isAuthenticated",
   "checkTaskLimit"
  ],
  "legacy": false,
  "params": [
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "project_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "priority",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "type",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "assignees",
    "in": "body",
    "type": "array",
    "required": false,
    "source": "interfaz CreateTaskInput"
   },
   {
    "name": "status",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTaskInput"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/tasks/:project_id",
  "key": "GET /tasks/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "project_id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/tasks/:taskId",
  "key": "DELETE /tasks/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "taskId",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/tasks/:taskId",
  "key": "PUT /tasks/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "taskId",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   },
   {
    "name": "priority",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   },
   {
    "name": "type",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   },
   {
    "name": "status",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   },
   {
    "name": "assignees",
    "in": "body",
    "type": "array",
    "required": false,
    "source": "interfaz UpdateTaskInput"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/tasks/generate",
  "key": "POST /tasks/generate",
  "auth": [
   "isAuthenticated",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "provider",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/time-entries",
  "key": "GET /time-entries",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "project_id",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "interfaz ListTimeEntriesInput"
   },
   {
    "name": "task_id",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "interfaz ListTimeEntriesInput"
   },
   {
    "name": "status",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "interfaz ListTimeEntriesInput"
   },
   {
    "name": "active",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "interfaz ListTimeEntriesInput"
   },
   {
    "name": "include_team",
    "in": "query",
    "type": "string",
    "required": false,
    "source": "interfaz ListTimeEntriesInput"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/time-entries",
  "key": "POST /time-entries",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "project_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "task_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "start_time",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "end_time",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "duration_seconds",
    "in": "body",
    "type": "number",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   },
   {
    "name": "status",
    "in": "body",
    "type": "TimeEntryStatus",
    "required": false,
    "source": "interfaz CreateTimeEntryInput"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/time-entries/:id",
  "key": "DELETE /time-entries/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/time-entries/:id",
  "key": "PUT /time-entries/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "project_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "task_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "start_time",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "end_time",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "duration_seconds",
    "in": "body",
    "type": "number",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   },
   {
    "name": "status",
    "in": "body",
    "type": "TimeEntryStatus",
    "required": false,
    "source": "interfaz UpdateTimeEntryInput"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/time-entries/:id/pause",
  "key": "PUT /time-entries/:p/pause",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/time-entries/:id/resume",
  "key": "PUT /time-entries/:p/resume",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/time-entries/:id/stop",
  "key": "PUT /time-entries/:p/stop",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/time-entries/start",
  "key": "POST /time-entries/start",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "project_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz StartTimeEntryInput"
   },
   {
    "name": "task_id",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz StartTimeEntryInput"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": false,
    "source": "interfaz StartTimeEntryInput"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/tokens",
  "key": "GET /tokens",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/tokens",
  "key": "POST /tokens",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "tokenType",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/tokens/:id",
  "key": "DELETE /tokens/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/updates",
  "key": "GET /updates",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/updates",
  "key": "POST /updates",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "title",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "date",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "youtube_url",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/updates/:id",
  "key": "DELETE /updates/:p",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/updates/:id",
  "key": "GET /updates/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/updates/:id",
  "key": "PUT /updates/:p",
  "auth": [
   "isAuthenticated",
   "isAdmin"
  ],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "title",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "description",
    "in": "body",
    "type": "object",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "category",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "date",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "youtube_url",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/updates/generate",
  "key": "POST /updates/generate",
  "auth": [
   "isAuthenticated",
   "isAdmin",
   "checkAICredits"
  ],
  "legacy": false,
  "params": [
   {
    "name": "prompt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "provider",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "model",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/upload",
  "key": "POST /upload",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "file",
    "in": "body",
    "type": "archivo (multipart)",
    "required": true,
    "source": "multipart"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/upload/:key",
  "key": "DELETE /upload/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "key",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "POST",
  "path": "/uploads",
  "key": "POST /uploads",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "file",
    "in": "body",
    "type": "archivo (multipart)",
    "required": true,
    "source": "multipart"
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/uploads/:key",
  "key": "DELETE /uploads/:p",
  "auth": [
   "isAuthenticated"
  ],
  "legacy": false,
  "params": [
   {
    "name": "key",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "GET",
  "path": "/user-count",
  "key": "GET /user-count",
  "auth": [],
  "legacy": true,
  "params": []
 },
 {
  "method": "GET",
  "path": "/users",
  "key": "GET /users",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/users",
  "key": "POST /users",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "privileges",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "status",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "user_data",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "DELETE",
  "path": "/users/:id",
  "key": "DELETE /users/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/users/:id",
  "key": "PUT /users/:p",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "privileges",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "status",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "user_data",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "POST",
  "path": "/users/:id/credits",
  "key": "POST /users/:p/credits",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "amount",
    "in": "body",
    "type": "string",
    "required": false
   },
   {
    "name": "isPurchase",
    "in": "body",
    "type": "boolean",
    "required": false,
    "default": "false"
   },
   {
    "name": "isBonus",
    "in": "body",
    "type": "boolean",
    "required": false,
    "default": "false"
   },
   {
    "name": "bonusExpiresAt",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/users/:id/password",
  "key": "PUT /users/:p/password",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "PUT",
  "path": "/users/:id/plan",
  "key": "PUT /users/:p/plan",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "id",
    "in": "path",
    "type": "string",
    "required": true
   },
   {
    "name": "tier",
    "in": "body",
    "type": "UserTier",
    "required": false,
    "source": "interfaz UpdatePlanData"
   },
   {
    "name": "credits",
    "in": "body",
    "type": "number",
    "required": false,
    "source": "interfaz UpdatePlanData"
   },
   {
    "name": "durationMonths",
    "in": "body",
    "type": "1 | 3 | 12",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/users/data",
  "key": "GET /users/data",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "GET",
  "path": "/users/me",
  "key": "GET /users/me",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/users/me/credit-priority",
  "key": "PUT /users/me/credit-priority",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "priority",
    "in": "body",
    "type": "array",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/users/plan",
  "key": "GET /users/plan",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "PUT",
  "path": "/users/public",
  "key": "PUT /users/public",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "isPublic",
    "in": "body",
    "type": "string",
    "required": false
   }
  ]
 },
 {
  "method": "GET",
  "path": "/users/public-users",
  "key": "GET /users/public-users",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/users/register",
  "key": "POST /users/register",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "name",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "password",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/users/usage",
  "key": "GET /users/usage",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/verification/request-password-reset",
  "key": "POST /verification/request-password-reset",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "email",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "POST",
  "path": "/verification/resend-verification",
  "key": "POST /verification/resend-verification",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/verification/reset-password",
  "key": "POST /verification/reset-password",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   },
   {
    "name": "newPassword",
    "in": "body",
    "type": "array",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 },
 {
  "method": "GET",
  "path": "/verification/status",
  "key": "GET /verification/status",
  "auth": [],
  "legacy": false,
  "params": []
 },
 {
  "method": "POST",
  "path": "/verification/verify-email",
  "key": "POST /verification/verify-email",
  "auth": [],
  "legacy": false,
  "params": [
   {
    "name": "token",
    "in": "body",
    "type": "string",
    "required": true,
    "source": "validacion (400/422)"
   }
  ]
 }
];

/** indice por clave para buscar desde la UI */
export const API_DOCS_BY_KEY: Record<string, ApiEndpointDoc> = Object.fromEntries(
  DOCS.map((d) => [d.key, d]),
);

export const API_DOCS_STATS = {
  endpoints: 214,
  conParametros: 176,
  totalParametros: 455,
};

/** metodo + ruta normalizada: los nombres de parametro se igualan a ":p" */
export function apiDocKey(method: string, path: string) {
  return (
    method.toUpperCase() +
    " " +
    path
      .trim()
      .replace(/^\/api/, "")
      .replace(/\/+$/, "")
      .replace(/:[A-Za-z0-9_]+/g, ":p")
      .toLowerCase()
  );
}

export function findApiDocs(method: string, path: string) {
  return API_DOCS_BY_KEY[apiDocKey(method, path)];
}
