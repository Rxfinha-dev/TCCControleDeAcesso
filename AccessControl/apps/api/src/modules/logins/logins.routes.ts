import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentSchool, requireModule } from '../../middlewares/school-scope';
import { loginInputSchema, type LoginsService } from './logins.service';

/** Logins de professores e alunos (só escola e super admin). A senha aparece só nesta resposta. */
export function loginsRoutes(service: LoginsService) {
  const router = Router();

  router.put('/teachers/:id', requireModule('ATTENDANCE'), async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { password } = loginInputSchema.parse(req.body ?? {});
    res.json(await service.setTeacherLogin(currentSchool(res).sub, id, password));
  });

  router.put('/students/:id', requireModule('ASSESSMENTS'), async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { password } = loginInputSchema.parse(req.body ?? {});
    res.json(await service.setStudentLogin(currentSchool(res).sub, id, password));
  });

  router.post('/class-groups/:id', requireModule('ASSESSMENTS'), async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.generateForClassGroup(currentSchool(res).sub, id));
  });

  return router;
}
