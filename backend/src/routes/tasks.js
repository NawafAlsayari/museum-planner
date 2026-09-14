import { Router } from 'express';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

// Helper: start/end of a day (local server timezone)
function dayRange(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return { start, end };
}

// List tasks for current user; optional ?view=daily|weekly|monthly&date=YYYY-MM-DD
router.get('/', async (req, res, next) => {
  try {
    const view = req.query.view || 'daily';
    let date = req.query.date ? new Date(req.query.date) : new Date();

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    let range = { start: null, end: null };

    if (view === 'daily') {
      range = dayRange(date);
    } else if (view === 'weekly') {
      // Start on Monday of the week
      const d = new Date(date);
      const day = d.getDay(); // 0 = Sunday
      const diff = (day + 6) % 7; // days since Monday
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
      range.start = start;
      range.end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    } else if (view === 'monthly') {
      range.start = new Date(date.getFullYear(), date.getMonth(), 1);
      range.end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    } else {
      return res.status(400).json({ error: 'view must be daily, weekly or monthly' });
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

    const task = await prisma.task.create({
      data: {
        userId: req.user.id,
        title,
        dueDate: new Date(dueDate),
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

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: title ?? task.title,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
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

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: title ?? task.title,
        dueDate: dueDate ? new Date(dueDate) : task.dueDate,
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
