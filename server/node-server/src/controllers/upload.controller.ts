import { Request, Response } from 'express';
import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configurar AWS S3
const s3 = new AWS.S3({
  endpoint: process.env.AWS_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'sysgd-uploads';

// Configurar multer para manejar archivos en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB límite
  },
  fileFilter: (req, file, cb) => {
    // Permitir todos los tipos de archivo por ahora
    cb(null, true);
  }
});

export const uploadMiddleware = upload.single('file');

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}/${uuidv4()}${fileExtension}`;

    // Parámetros para S3
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Hacer el archivo público para lectura
      Metadata: {
        'original-name': file.originalname,
        'user-id': userId.toString(),
        'upload-date': new Date().toISOString()
      }
    };
console.log('uploadParams', uploadParams);
    // Subir archivo a S3
    const result = await s3.upload(uploadParams).promise();

    // Formatear respuesta
    const response = {
      url: result.Location,
      key: result.Key,
      attachment_name: file.originalname,
      attachment_size: formatFileSize(file.size),
      attachment_type: getAttachmentType(file.mimetype),
      bucket: BUCKET_NAME
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.status(500).json({ error: 'Error interno del servidor al subir archivo' });
  }
};

// Función auxiliar para determinar el tipo de archivo
const getAttachmentType = (mimetype: string): 'image' | 'audio' | 'video' | 'file' => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('video/')) return 'video';
  return 'file';
};

// Función auxiliar para formatear el tamaño del archivo
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Endpoint para eliminar archivos
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que el archivo pertenece al usuario
    if (!key.startsWith(`${userId}/`)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este archivo' });
    }

    // Eliminar archivo de S3
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();

    res.json({ message: 'Archivo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar archivo' });
  }
};
