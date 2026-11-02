import multer from 'multer';
import { badRequest } from '../lib/errors';

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

/** Upload da foto do aluno em memória (máx. 2 MB). */
export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
      return callback(badRequest('Formato de imagem não suportado. Use JPG, PNG, WEBP ou BMP.'));
    }
    callback(null, true);
  },
}).single('photo');
