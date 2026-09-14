import { Router } from 'express';
import multer from 'multer';
import prisma from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const VALID_TYPES = ['PHOTO', 'PROJECT', 'ACHIEVEMENT'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|gif|webp)/.test(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only image files are allowed'));
  },
});

// Never ship raw image bytes in JSON API responses; the image is served
// separately from /uploads/:id.
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

const router = Router();

// All exhibit routes below require authentication (owner operations)
router.use(requireAuth);

// List current user's exhibits
router.get('/', async (req, res, next) => {
  try {
    const exhibits = await prisma.exhibit.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      select: exhibitSelect,
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
      select: exhibitSelect,
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
      select: exhibitSelect,
    });
    return res.status(201).json({ exhibit });
  } catch (err) {
    return next(err);
  }
});

// Upload an image for an exhibit (stored in the database)
router.post('/:id/image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image file is required' });

    const exhibit = await prisma.exhibit.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      select: { id: true },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    const updated = await prisma.exhibit.update({
      where: { id: exhibit.id },
      data: {
        imageUrl: `/uploads/${exhibit.id}`,
        imageData: req.file.buffer,
        imageMime: req.file.mimetype,
      },
      select: exhibitSelect,
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
      select: { id: true },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    const updated = await prisma.exhibit.update({
      where: { id: exhibit.id },
      data: {
        type: type || undefined,
        title: title ?? undefined,
        description: description ?? undefined,
        date: date ? new Date(date) : undefined,
      },
      select: exhibitSelect,
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
      select: { id: true },
    });
    if (!exhibit) return res.status(404).json({ error: 'Exhibit not found' });

    await prisma.exhibit.delete({ where: { id: exhibit.id } });
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

export default router;
