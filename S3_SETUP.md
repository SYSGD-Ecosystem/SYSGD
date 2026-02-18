# Configuración de AWS S3 para Uploads

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env` en el servidor:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=sysgd-uploads
```

## Configuración del Bucket S3

1. **Crear un bucket en AWS S3**:
   - Nombre: `sysgd-uploads` (o el que prefieras)
   - Región: `us-east-1` (o la que prefieras)
   - Configuración pública: Deshabilitada (los archivos se hacen públicos individualmente)

2. **Configurar CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000", "https://tu-dominio.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Configurar Política de Bucket** (opcional, para mayor seguridad):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::sysgd-uploads/*"
       }
     ]
   }
   ```

## Estructura de Archivos

Los archivos se organizan de la siguiente manera:
```
bucket-name/
├── user-id-1/
│   ├── uuid-file1.jpg
│   ├── uuid-file2.pdf
│   └── ...
├── user-id-2/
│   ├── uuid-file3.mp4
│   └── ...
└── ...
```

## Límites

- **Tamaño máximo por archivo**: 50MB
- **Tipos de archivo**: Todos los tipos permitidos
- **Organización**: Archivos organizados por usuario
- **Acceso**: Archivos públicos para lectura

## Endpoints Disponibles

- `POST /api/uploads` - Subir archivo
- `DELETE /api/uploads/:key` - Eliminar archivo

## Respuesta de Upload

```json
{
  "url": "https://s3.amazonaws.com/bucket/user-id/uuid-file.jpg",
  "key": "user-id/uuid-file.jpg",
  "attachment_name": "original-filename.jpg",
  "attachment_size": "2.5 MB",
  "attachment_type": "image",
  "bucket": "sysgd-uploads"
}
```
