import { Router } from 'express';
import { idParamSchema } from '../../lib/validation';
import { currentSchool } from '../../middlewares/school-scope';
import type { AssignmentsService } from './assignments.service';
import {
  addStudentsSchema,
  assignmentSchema,
  classGroupSchema,
  listClassGroupsQuerySchema,
  studentParamsSchema,
  subjectParamsSchema,
} from './class-groups.schemas';
import type { ClassGroupsService } from './class-groups.service';
import type { EnrollmentsService } from './enrollments.service';

export interface ClassGroupsServices {
  classGroups: ClassGroupsService;
  enrollments: EnrollmentsService;
  assignments: AssignmentsService;
}

export function classGroupsRoutes({ classGroups, enrollments, assignments }: ClassGroupsServices) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { schoolYear } = listClassGroupsQuerySchema.parse(req.query);
    res.json(await classGroups.list(currentSchool(res).sub, schoolYear));
  });

  router.post('/', async (req, res) => {
    res.status(201).json(await classGroups.create(currentSchool(res).sub, classGroupSchema.parse(req.body)));
  });

  router.get('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await classGroups.get(currentSchool(res).sub, id));
  });

  router.put('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await classGroups.update(currentSchool(res).sub, id, classGroupSchema.parse(req.body)));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    await classGroups.remove(currentSchool(res).sub, id);
    res.status(204).end();
  });

  router.get('/:id/students', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    res.json(await enrollments.list(currentSchool(res).sub, id));
  });

  router.post('/:id/students', async (req, res) => {
    const { id } = idParamSchema.parse(req.params);
    const { studentIds } = addStudentsSchema.parse(req.body);
    res.json(await enrollments.add(currentSchool(res).sub, id, studentIds));
  });

  router.delete('/:id/students/:studentId', async (req, res) => {
    const { id, studentId } = studentParamsSchema.parse(req.params);
    await enrollments.remove(currentSchool(res).sub, id, studentId);
    res.status(204).end();
  });

  router.put('/:id/assignments/:subjectId', async (req, res) => {
    const { id, subjectId } = subjectParamsSchema.parse(req.params);
    const { teacherId } = assignmentSchema.parse(req.body);
    res.json(await assignments.set(currentSchool(res).sub, id, subjectId, teacherId));
  });

  router.delete('/:id/assignments/:subjectId', async (req, res) => {
    const { id, subjectId } = subjectParamsSchema.parse(req.params);
    await assignments.remove(currentSchool(res).sub, id, subjectId);
    res.status(204).end();
  });

  return router;
}
