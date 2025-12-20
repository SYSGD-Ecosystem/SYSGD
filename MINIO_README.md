# MinIO (S3 local) - SYSGD

Este documento describe cómo usar MinIO como S3 local para desarrollo.

## Puertos

- API S3: `http://localhost:9000`
- Consola web: `http://localhost:9001`

## Credenciales (dev)

Ejemplo común en este proyecto:

- `MINIO_ROOT_USER=admin`
- `MINIO_ROOT_PASSWORD=password123`

## Opción A) Usar el contenedor existente (recomendado si ya lo tienes)

En tu máquina ya existe un contenedor MinIO (por ejemplo `great_jang`).

### Iniciar

```bash
sudo docker start great_jang
```

### Verificar

```bash
sudo docker ps | grep minio
```

Si está OK, debes ver mapeados los puertos `9000-9001`.

## Opción B) Levantar MinIO con Docker Compose (nuevo)

Si prefieres gestionarlo desde el repo, puedes usar el servicio `minio-dev` que está definido en:

- `server/node-server/docker-compose.yml`

Levantarlo:

```bash
sudo docker compose up -d minio-dev
```

Ver logs:

```bash
sudo docker logs -f minio-dev
```

## Bucket

La app necesita un bucket (por ejemplo `sysgd-uploads`). Si el bucket no existe, debes crearlo.

### Crear bucket desde la consola web

1. Abre `http://localhost:9001`
2. Login con las credenciales
3. Crea el bucket: `sysgd-uploads`

## Variables de entorno del backend

Ajusta tu `server/node-server/.env.development` (o `.env`) para apuntar a MinIO.

Ejemplo típico:

```env
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=password123
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=sysgd-uploads
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
```

### Notas importantes

- Si usas MinIO, el `AWS_S3_ENDPOINT` debe ser `http://localhost:9000`.
- `AWS_S3_FORCE_PATH_STYLE=true` suele ser necesario para compatibilidad con S3 local.
- El warning de AWS SDK v2 en consola es **informativo**; no bloquea el funcionamiento.

## Troubleshooting

- Si ves errores de conexión a `localhost:9000`, verifica:

```bash
curl -I http://localhost:9000/minio/health/live
```

- Si el contenedor existe pero no responde, reinícialo:

```bash
sudo docker restart great_jang
```
