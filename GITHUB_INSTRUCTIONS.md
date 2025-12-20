# GitHub Integration - SYSGD

Este documento explica cómo integrar un repositorio de GitHub con SYSGD para monitorear Pull Requests y métricas.

## Requisitos Previos

1. **Token de GitHub** con permisos de lectura (`public_repo`)
2. **URL del repositorio** (owner/repo)
3. **Backend corriendo** con los endpoints de GitHub API

## Cómo Obtener un Token de GitHub

1. Ve a **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clic en **Generate new token** → **Generate new token (classic)**
3. Configura:
   - **Note**: "SYSGD Integration"
   - **Expiration**: elige un período apropiado
   - **Scopes**: marca `public_repo` (para repositorios públicos) o `repo` (para privados)
4. Clic en **Generate token**
5. **Copia el token** (no podrás volver a verlo)

## Pasos para Integrar un Repositorio

### 1. Acceder a la Integración GitHub

En el proyecto SYSGD, ve a la sección de **GitHub Integration**.

### 2. Configurar el Repositorio

Completa los siguientes campos:

- **Owner**: El usuario u organización dueña del repositorio
  - Ejemplo: `facebook`, `microsoft`, `tu-usuario`
- **Repository**: El nombre del repositorio
  - Ejemplo: `react`, `vscode`, `mi-proyecto`
- **GitHub Token**: El token que generaste en el paso anterior
  - Formato: `ghp_xxxxxxxxxxxxxxxxxxxx`

### 3. Validar el Repositorio

Clic en **"Validar Repositorio"**. El sistema verificará:
- ✅ Que el repositorio exista
- ✅ Que el token tenga los permisos necesarios
- ✅ Que se pueda acceder a la información del repositorio

Si todo es correcto, verás:
- ✅ Mensaje de éxito
- 📊 Métricas del repositorio
- 📋 Lista de Pull Requests

## Funcionalidades Disponibles

### 📊 Métricas del Repositorio

- **Total PRs**: Número total de Pull Requests
- **Abiertos**: PRs actualmente abiertos
- **Mergeados**: PRs que han sido fusionados
- **Tasa de Merge**: Porcentaje de PRs mergeados

### 📋 Pull Requests

Verás una tabla con:
- **Número**: ID del PR
- **Título**: Descripción del PR
- **Autor**: Quién creó el PR (con avatar)
- **Estado**: Abierto/Cerrado/Mergeado
- **Fecha**: Fecha de creación
- **Cambios**: Líneas añadidas/eliminadas
- **Archivos**: Número de archivos modificados
- **Enlace**: Acceso directo al PR en GitHub

### 🔍 Filtros

Puedes filtrar los PRs por:
- **Estado**: Todos/Abiertos/Cerrados
- **Ordenar por**: Fecha de creación/actualización/Popularidad
- **Dirección**: Ascendente/Descendente

### 📄 Paginación

- Navega entre páginas de resultados
- 50 PRs por página
- Controles intuitivos de navegación

## Ejemplos de Configuración

### Repositorio Público

```
Owner: facebook
Repository: react
Token: ghp_1234567890abcdef...
```

### Repositorio Privado

```
Owner: tu-empresa
Repository: proyecto-interno
Token: ghp_0987654321fedcba...
```

## Troubleshooting

### ❌ "No se pudo validar el repositorio"

- Verifica que el **owner** y **repository** estén correctos
- Confirma que el **token** tenga los permisos necesarios
- Asegúrate que el repositorio exista y sea accesible

### ❌ "Error al cargar los Pull Requests"

- Verifica tu conexión a internet
- Revisa que el token no haya expirado
- Intenta recargar la página

### ❌ "Token inválido"

- Genera un nuevo token siguiendo los pasos anteriores
- Asegúrate de copiar el token completo (incluyendo `ghp_`)

## Permisos del Token

| Permiso | Descripción | Uso en SYSGD |
|---------|-------------|--------------|
| `public_repo` | Acceso a repositorios públicos | ✅ Suficiente para repos públicos |
| `repo` | Acceso completo a repositorios | ✅ Necesario para repos privados |
| `read:org` | Leer datos de organizaciones | ✅ Si el repo está en una org |

## Seguridad

- 🔒 Los tokens se almacenan de forma segura
- 🚫 Nunca compartas tu token con otros
- 🔄 Renueva los tokens periódicamente
- ⚠️ Usa tokens con el mínimo permiso necesario

## API Endpoints (Referencia)

El frontend utiliza estos endpoints del backend:

- `POST /api/github/validate` - Validar repositorio
- `POST /api/github/repository` - Obtener información del repo
- `POST /api/github/pull-requests` - Listar PRs (con paginación)
- `POST /api/github/metrics` - Obtener métricas

## Soporte

Si tienes problemas:
1. Revisa este documento
2. Verifica los logs del backend
3. Contacta al administrador del sistema
