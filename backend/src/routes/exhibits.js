import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const VALID_TYPES = ['PHOTO', 'PROJECT', 'ACHIEVEMENT'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
  },
});

const router = Router();

// All exhibit routes below require authentication (owner operations)
router.use(requireAuth);

// List current user's exhibits
router.get('/', async (req, res, next) => {
  try {
    const exhibits = await prisma.exhibit.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
    });
    return res.json({ exhibits });
  } catch (err) {
    return next(err);
  }
});

// Get a single exhibit owned by the user
router.get('/:id', async (req, res, next) => {
  try {
    const exhibit = await prisma.exhibit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });
    return res.json({ exhibit });
  } catch (err) {
    return next(err);
  }
});

// Create an exhibit
router.post('/', async (req, res, next) => {
  try {
    const { type, title, description, date } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const exhibit = await prisma.exhibit.create({
      data: {
        userId: req.user.id,
        type,
        title,
        description: description || '',
        date: date ? new Date(date) : null,
      },
    });
    return res.status(201).json({ exhibit });
  } catch (err) {
    return next(err);
  }
});

// Upload an image for an exhibit
router.post('/:id/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file is required' });

    const exhibit = await prisma.exhibit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const updated = await prisma.exhibit.update({
      where: { id: exhibit.id },
      data: { imageUrl },
    });
    return res.json({ exhibit: updated });
  } catch (err) {
    return next(err);
  }
});

// Update an exhibit
router.put('/:id', async (req, res, next) => {
  try {
    const { type, title, description, date } = req.body;
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` });
    }

    const exhibit = await prisma.exhibit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    const updated = await prisma.exhibit.update({
      where: { id: exhibit.id },
      data: {
        type: type || exhibit.type,
        title: title ?? exhibit.title,
        description: description ?? exhibit.description,
        date: date ? new Date(date) : exhibit.date,
      },
    });
    return res.json({ exhibit: updated });
  } catch (err) {
    return next(err);
  }
});

// Delete an exhibit
router.delete('/:id', async (req, res, next) => {
  try {
    const exhibit = await prisma.exhibit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    // Remove associated local image if present
    if (exhibit.imageUrl) {
      const filename = path.basename(exhibit.imageUrl);
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await prisma.exhibit.delete({ where: { id: exhibit.id } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
