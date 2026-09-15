import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toDateTime, dayRangeUtc, weekRangeUtc, monthRangeUtc } from '../utils/date.js';

const router = Router();

router.use(requireAuth);

const MAX_TITLE = 200;

// List tasks for current user; optional ?view=daily|weekly|monthly&date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const view = req.query.view || 'daily';
    // The frontend always sends a date; fall back to the current UTC day so the
    // endpoint still works when the param is omitted.
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    let range;
    if (view === 'daily') range = dayRangeUtc(date);
    else if (view === 'weekly') range = weekRangeUtc(date);
    else if (view === 'monthly') range = monthRangeUtc(date);
    else return res.status(400).json({ error: 'view must be daily, weekly or monthly' });

    if (!range) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
        dueDate: {
          gte: range.start,
          lt: range.end,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return res.json({ view, tasks });
  } catch (err) {
    return next(err);
  }
});

// Create a task
router.post('/', async (req, res, next) => {
  try {
    const { title, dueDate } = req.body;
    if (!title || !dueDate) {
      return res.status(400).json({ error: 'title and dueDate are required' });
    }
    if (typeof title !== 'string' || title.trim().length > MAX_TITLE) {
      return res.status(400).json({ error: `title must be ${MAX_TITLE} characters or fewer` });
    }
    const parsed = toDateTime(dueDate);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid dueDate' });
    }

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        dueDate: parsed,
      },
    });
    return res.status(201).json({ task });
  } catch (err) {
    return next(err);
  }
});

// Toggle completion (and edit title/dueDate if provided)
router.patch('/:id', async (req, res, next) => {
  try {
    const { title, dueDate, completed } = req.body;
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (title !== undefined && (typeof title !== 'string' || title.trim().length > MAX_TITLE)) {
      return res.status(400).json({ error: `title must be ${MAX_TITLE} characters or fewer` });
    }
    let dateValue = undefined;
    if (dueDate !== undefined) {
      dateValue = toDateTime(dueDate);
      if (!dateValue) return res.status(400).json({ error: 'Invalid dueDate' });
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: title !== undefined ? title.trim() : task.title,
        dueDate: dateValue !== undefined ? dateValue : task.dueDate,
        completed: completed ?? task.completed,
      },
    });
    return res.json({ task: updated });
  } catch (err) {
    return next(err);
  }
});

// Update a task (alias for PUT)
router.put('/:id', async (req, res, next) => {
  try {
    const { title, dueDate, completed } = req.body;
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (title !== undefined && (typeof title !== 'string' || title.trim().length > MAX_TITLE)) {
      return res.status(400).json({ error: `title must be ${MAX_TITLE} characters or fewer` });
    }
    let dateValue = undefined;
    if (dueDate !== undefined) {
      dateValue = toDateTime(dueDate);
      if (!dateValue) return res.status(400).json({ error: 'Invalid dueDate' });
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: title !== undefined ? title.trim() : task.title,
        dueDate: dateValue !== undefined ? dateValue : task.dueDate,
        completed: completed ?? task.completed,
      },
    });
    return res.json({ task: updated });
  } catch (err) {
    return next(err);
  }
});

// Delete a task
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await prisma.task.delete({ where: { id: task.id } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
