import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Public exhibit fields (raw image bytes are never exposed over JSON).
const exhibitSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  imageUrl: true,
  date: true,
  createdAt: true,
  updatedAt: true,
};

// Public single exhibit (must belong to a public museum)
router.get('/exhibit/:id', async (req, res, next) => {
  try {
    const exhibit = await prisma.exhibit.findUnique({
      where: { id: req.params.id },
      select: {
        ...exhibitSelect,
        user: { select: { username: true, displayName: true, isPublic: true } },
      },
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
      select: exhibitSelect,
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
