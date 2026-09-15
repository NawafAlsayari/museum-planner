import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { isMailConfigured, sendPasswordResetEmail } from '../services/mailer.js';

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

// Request a password reset link (emailed to the account).
// Responds the same way whether or not the email exists, to avoid revealing
// which accounts are registered.
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!isMailConfigured()) {
      return res.status(503).json({ error: 'Password reset is not configured on this server.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const appUrl =
      process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

    try {
      await sendPasswordResetEmail({ to: user.email, resetLink });
    } catch (err) {
      // Roll the token back so the user can retry cleanly.
      await prisma.passwordResetToken.delete({ where: { tokenHash } });
      throw err;
    }

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    return next(err);
  }
});

// Complete a password reset using a token from the email link.
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'token and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return res.json({ message: 'Password updated. You can now sign in.' });
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
