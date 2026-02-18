import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middlewares/auth-jwt';
import { uploadMiddleware, uploadFile, deleteFile } from '../controllers/upload.controller';

const router = Router();

// Upload file to S3
router.post('/', isAuthenticated, uploadMiddleware, async (req: Request, res: Response) => {
  await uploadFile(req, res);
});

// Delete file from S3
router.delete('/:key', isAuthenticated, async (req: Request, res: Response) => {
  await deleteFile(req, res);
});

export default router;
