import type { RequestHandler } from 'express';
import multer from 'multer';
import { badRequest } from '../lib/errors';

export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

/** Bytes iniciais de cada tipo aceito: o Content-Type vem do cliente e a foto é servida de volta com ele. */
export function matchesSignature(mimetype: string, data: Buffer): boolean {
  // switch em vez de objeto indexado: nenhuma string do cliente escolhe a função a chamar
  switch (mimetype) {
    case 'image/jpeg':
      return data.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    case 'image/png':
      return data.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    case 'image/webp':
      return data.subarray(0, 4).toString('latin1') === 'RIFF' && data.subarray(8, 12).toString('latin1') === 'WEBP';
    case 'image/bmp':
      return data.subarray(0, 2).toString('latin1') === 'BM';
    default:
      return false;
  }
}

/** Upload da foto do aluno em memória (máx. 2 MB). Limita os campos de texto: tudo fica na memória antes do Zod. */
const multerPhoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 10, fieldSize: 1024, parts: 11 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
      return callback(badRequest('Formato de imagem não suportado. Use JPG, PNG, WEBP ou BMP.'));
    }
    callback(null, true);
  },
}).single('photo');

/** Foto opcional no campo "photo"; o conteúdo precisa bater com o tipo declarado. */
export const photoUpload: RequestHandler = (req, res, next) => {
  multerPhoto(req, res, (err: unknown) => {
    if (err) return next(err);
    if (req.file && !matchesSignature(req.file.mimetype, req.file.buffer)) {
      return next(badRequest('O arquivo enviado não é uma imagem válida. Use JPG, PNG, WEBP ou BMP.', 'INVALID_PHOTO'));
    }
    next();
  });
};
