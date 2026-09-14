import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Public single exhibit (must belong to a public museum)
router.get('/exhibit/:id', async (req, res, next) => {
  try {
    const exhibit = await prisma.exhibit.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { username: true, displayName: true, isPublic: true } } },
    });

    if (!exhibit || !exhibit.user.isPublic) {
      return res.status(404).json({ error: 'Exhibit not found' });
    }

    return res.json({ exhibit });
  } catch (err) {
    return next(err);
  }
});

// Public museum page for a given username
router.get('/:username', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
    });

    if (!user || !user.isPublic) {
      return res.status(404).json({ error: 'Museum not found' });
    }

    const exhibits = await prisma.exhibit.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    return res.json({
      museum: {
        username: user.username,
        displayName: user.displayName,
      },
      exhibits,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
