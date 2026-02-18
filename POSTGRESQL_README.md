# PostgreSQL (Dev) - SYSGD

Este documento describe cómo preparar y levantar PostgreSQL para el entorno de desarrollo de SYSGD.

## Requisitos

- PostgreSQL instalado (servicio systemd)
- Puerto `5432` libre

## 1) Arrancar PostgreSQL

```bash
sudo systemctl start postgresql
```

### Verificar que esté activo

```bash
sudo systemctl status postgresql
```

Debes ver `active (running)`.

## 2) Habilitar arranque automático (recomendado)

Para que PostgreSQL arranque automáticamente cuando reinicies el sistema:

```bash
sudo systemctl enable postgresql
```

### Explicación

- `start` inicia el servicio **solo ahora**.
- `enable` lo marca para iniciarse **en cada arranque**.
- Si quieres deshabilitarlo:

```bash
sudo systemctl disable postgresql
```

## 3) Crear usuario y base de datos para SYSGD

Entra como usuario `postgres` y abre `psql`:

```bash
sudo -iu postgres
psql
```

Dentro de `psql` ejecuta:

```sql
CREATE USER sysgd_user WITH PASSWORD '1234';
CREATE DATABASE sysgd OWNER sysgd_user;
GRANT ALL PRIVILEGES ON DATABASE sysgd TO sysgd_user;
```

Salir:

```sql
\q
```

## 4) Variables de entorno del backend

En `server/node-server/.env.development` (o tu `.env`) configura:

```env
DB_USER=sysgd_user
DB_PASSWORD=1234
DB_HOST=localhost
DB_NAME=sysgd
DB_PORT=5432
INIT_DB_ON_START=true
```

## 5) Comprobación rápida

- Si tu backend muestra `ECONNREFUSED`, normalmente significa que PostgreSQL no está corriendo o está escuchando en otro host/puerto.
- También puede ocurrir si el sistema se actualizó y PostgreSQL cambió de versión (formato de datos). En ese caso, revisa logs:

```bash
sudo journalctl -u postgresql -n 50 --no-pager
```
