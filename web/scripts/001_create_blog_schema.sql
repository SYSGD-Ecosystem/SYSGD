-- Creating database schema for blog system with posts, comments, and reactions

-- Table for blog posts/updates
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_avatar VARCHAR(500),
    author_role VARCHAR(100) DEFAULT 'Developer',
    featured_image VARCHAR(500),
    published_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for post reactions (like, love, fire, etc.)
CREATE TABLE IF NOT EXISTS post_reactions (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- 'like', 'love', 'fire', 'clap', 'thinking'
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_email, reaction_type)
);

-- Table for comments on posts
CREATE TABLE IF NOT EXISTS post_comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES post_comments(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for comment reactions
CREATE TABLE IF NOT EXISTS comment_reactions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- 'like', 'dislike'
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, user_email, reaction_type)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date ON blog_posts(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);

-- Insert sample blog posts
INSERT INTO blog_posts (slug, title, description, content, category, author_name, author_avatar, author_role, featured_image, published_date)
VALUES 
(
    'integracion-github-rastreo',
    'Integración con GitHub para Rastreo de Actividad',
    'Nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests.',
    '## Integración con GitHub para Rastreo de Actividad\n\nEstamos emocionados de anunciar una nueva integración que permite conectar repositorios de GitHub para obtener información detallada de Pull Requests: usuario creador, líneas añadidas/eliminadas y archivos modificados.\n\n### Características principales:\n\n- **Rastreo de actividad real**: Monitorea cuánto trabaja cada desarrollador\n- **Información detallada de PRs**: Visualiza estadísticas completas\n- **Exportación a Excel**: Analiza datos externamente\n- **Optimizado para memoria**: No recarga objetos innecesariamente\n\n### Configuración\n\nCada usuario debe configurar su propio Personal Access Token:\n\n1. Ve a GitHub Settings\n2. Developer settings > Personal access tokens\n3. Generate new token con permisos `repo`\n4. Pega el token en SYSGD\n\nIdeal para empresas y pequeños equipos que necesitan rastrear el nivel de actividad real de cada desarrollador.',
    'Nueva Funcionalidad',
    'Equipo SYSGD',
    '/placeholder.svg?height=40&width=40',
    'Development Team',
    '/placeholder.svg?height=400&width=800',
    '2025-12-22'
),
(
    'dinamizacion-tareas-editor',
    'Dinamización de Tareas y Editor Mejorado',
    'Mejoras sustanciales en el sistema de tareas con tipos dinámicos, Markdown y soporte de imágenes.',
    '## Dinamización de Tareas y Editor Mejorado\n\nEstamos trabajando en hacer las tareas más flexibles y poderosas.\n\n### Nuevas características:\n\n#### Tipos y Estados Dinámicos\n\nAhora puedes asignar tipos, estados y otros elementos de forma dinámica en lugar de fija. Para ello se habilitó una nueva página de ajustes donde puedes:\n\n- Crear tipos de tareas personalizados\n- Definir estados según tu flujo de trabajo\n- Configurar campos adicionales\n\n#### Editor con Markdown\n\nImplementamos mejoras sustanciales en el editor de tareas:\n\n- **Soporte Markdown completo**: Formateo rico de texto\n- **Subida de imágenes**: Adjunta capturas y diagramas\n- **Vista previa en tiempo real**: Ve cómo se verá tu contenido\n- **Sintaxis highlighting**: Para snippets de código\n\n### Beneficios\n\nEstas mejoras permiten documentar mejor el trabajo y mejorar la comunicación del equipo.',
    'Mejora',
    'Equipo SYSGD',
    '/placeholder.svg?height=40&width=40',
    'Development Team',
    '/placeholder.svg?height=400&width=800',
    '2025-12-22'
),
(
    'lanzamiento-pagina-institucional',
    'Lanzamiento de la Página Institucional',
    'Presentamos la nueva página institucional pública de SYSGD Ecosystem.',
    '## Lanzamiento de la Página Institucional\n\n¡Bienvenidos a la nueva página institucional de SYSGD Ecosystem!\n\n### ¿Qué encontrarás aquí?\n\n- **Roadmap actualizado**: Sigue el progreso de cada módulo\n- **Blog de actualizaciones**: Mantente al día con las novedades\n- **Documentación**: Aprende cómo usar SYSGD\n- **Precios y planes**: Descubre las opciones disponibles\n\n### Transparencia en el desarrollo\n\nCreemos en el código abierto y la transparencia. Aunque el repositorio está actualmente en fase beta, compartimos abiertamente nuestro progreso.\n\n### Próximos pasos\n\nEstaremos publicando actualizaciones regulares sobre:\n- Nuevas funcionalidades\n- Mejoras de rendimiento\n- Corrección de bugs\n- Guías y tutoriales\n\n¡Gracias por ser parte de esta comunidad!',
    'Anuncio',
    'Equipo SYSGD',
    '/placeholder.svg?height=40&width=40',
    'Development Team',
    '/placeholder.svg?height=400&width=800',
    '2025-12-21'
);
