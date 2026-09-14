import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Creates the admin account, renames the default one if SEED_EMAIL changed,
// and keeps its credentials in sync with the SEED_* env vars (the source of
// truth for the deploy). The same user row is updated, so exhibits/tasks stay.
async function ensureAdmin() {
  const email = process.env.SEED_EMAIL || 'admin@example.com';
  const username = process.env.SEED_USERNAME || 'admin';
  const password = process.env.SEED_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
      console.log(`Admin "${email}" credentials updated from env.`);
    } else {
      console.log(`Admin user "${email}" already exists, skipping user seed.`);
    }
    return existing;
  }

  // The admin's email changed via SEED_EMAIL: rename the default admin account
  // instead of creating a second one.
  const legacy = await prisma.user.findFirst({ where: { email: 'admin@example.com' } });
  if (legacy) {
    const data = { email, username, displayName: 'Museum Owner' };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }
    const updated = await prisma.user.update({ where: { id: legacy.id }, data });
    console.log(`Admin account updated to ${email}.`);
    return updated;
  }

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password || 'admin123', 10),
      displayName: 'Museum Owner',
      username,
      isPublic: true,
    },
  });
  console.log(`Seeded admin user: ${email}`);
  return admin;
}

async function main() {
  const admin = await ensureAdmin();

  const exhibitCount = await prisma.exhibit.count({ where: { userId: admin.id } });
  if (exhibitCount === 0) {
    const exhibits = [
      {
        userId: admin.id,
        type: 'ACHIEVEMENT',
        title: 'First Launch',
        description: 'The moment this personal museum went live.',
        date: new Date('2026-01-15'),
      },
      {
        userId: admin.id,
        type: 'PROJECT',
        title: 'Museum & Planner',
        description: 'A personal website combining a curated museum and a task planner.',
        date: new Date('2026-02-20'),
      },
      {
        userId: admin.id,
        type: 'PHOTO',
        title: 'Workspace',
        description: 'A snapshot of the desk where the work happens.',
        date: new Date('2026-03-10'),
      },
    ];
    for (const e of exhibits) {
      await prisma.exhibit.create({ data: e });
    }
    console.log(`Seeded ${exhibits.length} exhibits.`);
  } else {
    console.log('Exhibits already present, skipping exhibit seed.');
  }

  const taskCount = await prisma.task.count({ where: { userId: admin.id } });
  if (taskCount === 0) {
    const today = new Date();
    const tasks = [
      { title: 'Review museum exhibits', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()), completed: false },
      { title: 'Add a new photo', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), completed: false },
      { title: 'Weekly planning review', dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7), completed: false },
    ];
    for (const t of tasks) {
      await prisma.task.create({
        data: { userId: admin.id, title: t.title, dueDate: t.dueDate, completed: t.completed },
      });
    }
    console.log(`Seeded ${tasks.length} tasks.`);
  } else {
    console.log('Tasks already present, skipping task seed.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
