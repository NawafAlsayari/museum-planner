import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL || 'admin@example.com';
  const password = process.env.SEED_PASSWORD || 'admin123';
  const username = process.env.SEED_USERNAME || 'admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: 'Museum Owner',
        username,
        isPublic: true,
      },
    });
    console.log(`Seeded admin user: ${email} / ${password}`);
  } else {
    console.log('Admin user already exists, skipping user seed.');
  }

  const admin = await prisma.user.findUnique({ where: { email } });

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
