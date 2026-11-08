import { Router } from 'express';
import { currentSchool, currentSchoolOrAll } from '../../middlewares/school-scope';
import {
  fingerprintEntrySchema,
  listAccessLogsQuerySchema,
  manualEntrySchema,
  type AccessLogsService,
} from './access-logs.service';

export function accessLogsRoutes(service: AccessLogsService) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(currentSchoolOrAll(res).sub, listAccessLogsQuerySchema.parse(req.query)));
  });

  router.get('/export', async (req, res) => {
    const csv = await service.exportCsv(currentSchoolOrAll(res).sub, listAccessLogsQuerySchema.parse(req.query));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="entradas.csv"');
    // BOM para o Excel reconhecer UTF-8 (acentos).
    res.send(String.fromCharCode(0xfeff) + csv);
  });

  router.post('/fingerprint', async (req, res) => {
    const { fingerprintId } = fingerprintEntrySchema.parse(req.body);
    res.status(201).json(await service.registerByFingerprint(currentSchool(res).sub, fingerprintId));
  });

  router.post('/manual', async (req, res) => {
    const { rm } = manualEntrySchema.parse(req.body);
    res.status(201).json(await service.registerManual(currentSchool(res).sub, rm));
  });

  return router;
}
