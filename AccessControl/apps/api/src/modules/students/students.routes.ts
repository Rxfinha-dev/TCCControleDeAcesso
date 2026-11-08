import { Router, type Request } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import { photoUpload } from '../../middlewares/upload';
import type { StoredPhoto } from '../../services/storage';
import { listStudentsQuerySchema, studentSchema } from './students.schemas';
import type { StudentsService } from './students.service';

const uploadedPhoto = (req: Request): StoredPhoto | undefined =>
  req.file ? { data: req.file.buffer, mimeType: req.file.mimetype } : undefined;

export function studentsRoutes(service: StudentsService) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(currentSchool(res).sub, listStudentsQuerySchema.parse(req.query)));
  });

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.get(currentSchool(res).sub, id));
  });

  router.post('/', photoUpload, async (req, res) => {
    const input = studentSchema.parse(req.body);
    res.status(201).json(await service.create(currentSchool(res).sub, input, uploadedPhoto(req)));
  });

  router.put('/:id', photoUpload, async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const input = studentSchema.parse(req.body);
    res.json(await service.update(currentSchool(res).sub, id, input, uploadedPhoto(req)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.remove(currentSchool(res).sub, id);
    res.status(204).end();
  });

  router.get('/:id/photo', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const photo = await service.getPhoto(currentSchool(res).sub, id);
    res.setHeader('Content-Type', photo.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(photo.data);
  });

  router.post('/:id/fingerprint', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.reserveFingerprint(currentSchool(res).sub, id));
  });

  router.post('/:id/fingerprint/confirm', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.confirmFingerprint(currentSchool(res).sub, id));
  });

  router.delete('/:id/fingerprint', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.clearFingerprint(currentSchool(res).sub, id));
  });

  return router;
}
