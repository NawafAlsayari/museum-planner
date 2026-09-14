import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { generateToken, requireAuth } from '../middleware/auth.js';

const router = Router();

// Register a new user (future multi-user support; also used in seed/tests)
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName, username } = req.body;

    if (!email || !password || !displayName || !username) {
      return res.status(400).json({ error: 'email, password, displayName and username are required' });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName, username },
    });

    const token = generateToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

// Current user
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: publicUser(user) });
  } catch (err) {
    return next(err);
  }
});

// Update profile (displayName, isPublic)
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { displayName, isPublic } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: displayName ?? user.displayName,
        isPublic: isPublic ?? user.isPublic,
      },
    });
    return res.json({ user: publicUser(updated) });
  } catch (err) {
    return next(err);
  }
});

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    username: user.username,
    isPublic: user.isPublic,
    createdAt: user.createdAt,
  };
}

export default router;
