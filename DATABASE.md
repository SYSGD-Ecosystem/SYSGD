# 🗄️ Configuración de la Base de Datos PostgreSQL para SYSGD

Este documento explica cómo instalar, configurar y preparar **PostgreSQL** para el proyecto **SYSGD** en **Arch Linux** (o derivados).

---

## 🧩 1. Verificar instalación de PostgreSQL

Primero, verifica si PostgreSQL está instalado:

```bash
psql --version
```

Si devuelve algo como psql (PostgreSQL) 16.x, ya está instalado.
Si no, instálalo con:

```bash
sudo pacman -S postgresql
```

## 🚀 2. Inicializar PostgreSQL (solo si es la primera vez)

Si acabas de instalarlo, inicializa el clúster de datos:

```bash
sudo -iu postgres
initdb --locale=en_US.UTF-8 -D /var/lib/postgres/data
exit
```

Luego inicia y habilita el servicio:

```bash
sudo systemctl enable postgresql --now
```

Verifica que esté corriendo:

```bash
sudo systemctl status postgresql
```

Debe aparecer como active (running).

## 👤 3. Crear usuario y base de datos para SYSGD

Accede a la consola de PostgreSQL:

```bash
sudo -iu postgres
psql
```

Dentro de psql, crea la base y el usuario:

```sql
-- Crear la base de datos
CREATE DATABASE sysgd;

-- Crear un usuario con contraseña segura
CREATE USER sysgd_user WITH PASSWORD 'mi_contraseña_segura';

-- Otorgar todos los privilegios sobre la base
GRANT ALL PRIVILEGES ON DATABASE sysgd TO sysgd_user;
```

## ⚠️ 4. Posible error de "collation mismatch"

Si aparece un error como:

```sql
discordancia en la versión de «collation»
```

Ejecuta lo siguiente como usuario postgres:

```sql
ALTER DATABASE template0 REFRESH COLLATION VERSION;
ALTER DATABASE template1 REFRESH COLLATION VERSION;
```

Luego vuelve a intentar:

```sql
CREATE DATABASE sysgd;
```

## 🧱 5. Conceder permisos sobre el esquema public

Una vez creada la base:

```sql
\c sysgd
GRANT ALL ON SCHEMA public TO sysgd_user;
ALTER SCHEMA public OWNER TO sysgd_user;
```

Esto garantiza que el usuario tenga acceso completo para crear y modificar tablas dentro del esquema public.

## ⚙️ 6. Permitir edición y creación de objetos

Para asegurarte de que sysgd_user pueda trabajar sin restricciones:

```sql
ALTER ROLE sysgd_user WITH LOGIN CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE sysgd TO sysgd_user;
```

## 🧪 7. Probar la conexión desde Node.js

Crea un archivo .env.development en server/node-server:

```ini
DB_USER=sysgd_user
DB_PASSWORD=mi_contraseña_segura
DB_HOST=localhost
DB_NAME=sysgd
DB_PORT=5432
```

## Ejecuta el servidor de desarrollo desde la rais del repo

```bash
npm run dev
```

🎯 Resultado final
Al finalizar este proceso tendrás:

✅ PostgreSQL instalado y ejecutándose.

👤 Usuario sysgd_user con permisos completos.

🗃️ Base de datos sysgd lista para uso.

🔗 Conexión estable desde el backend Node.js.

💡 Consejo:
Si reinstalas el sistema o PostgreSQL se actualiza, revisa las versiones de collation con:

```sql
\l
```

y usa ALTER DATABASE ... REFRESH COLLATION VERSION; si alguna aparece con advertencias.

© SYSGD — Sistema de Gestión Documental
Configuración del entorno de base de datos
