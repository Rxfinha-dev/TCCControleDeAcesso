import { Router } from 'express';
import { z } from 'zod';
import { currentSchoolYear } from '../../lib/dates';
import { badRequest } from '../../lib/errors';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import {
  holidayActiveSchema,
  holidayParamsSchema,
  noClassDaySchema,
  termsSchema,
  yearSchema,
  type CalendarService,
} from './calendar.service';

const querySchema = z.object({ year: yearSchema.optional() });
const termsParamsSchema = z.object({ schoolYear: yearSchema });

export function calendarRoutes(service: CalendarService) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { year } = querySchema.parse(req.query);
    res.json(await service.get(currentSchool(res).sub, year ?? currentSchoolYear()));
  });

  router.put('/holidays/:date', async (req, res) => {
    const { date } = holidayParamsSchema.parse(req.params);
    const { active } = holidayActiveSchema.parse(req.body);
    await service.setHolidayActive(currentSchool(res).sub, date, active);
    res.status(204).end();
  });

  router.post('/no-class-days', async (req, res) => {
    res.status(201).json(await service.createNoClassDay(currentSchool(res).sub, noClassDaySchema.parse(req.body)));
  });

  router.put('/no-class-days/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await service.updateNoClassDay(currentSchool(res).sub, id, noClassDaySchema.parse(req.body)));
  });

  router.delete('/no-class-days/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await service.removeNoClassDay(currentSchool(res).sub, id);
    res.status(204).end();
  });

  router.put('/terms/:schoolYear', async (req, res) => {
    const { schoolYear } = termsParamsSchema.parse(req.params);
    const { terms } = termsSchema.parse(req.body);
    const inYear = (date: string) => date.startsWith(`${schoolYear}-`);
    if (terms.some((term) => !inYear(term.startDate) || !inYear(term.endDate))) {
      throw badRequest(`Os bimestres precisam estar dentro do ano letivo de ${schoolYear}`, 'TERM_OUT_OF_YEAR');
    }
    res.json(await service.setTerms(currentSchool(res).sub, schoolYear, terms));
  });

  return router;
}
