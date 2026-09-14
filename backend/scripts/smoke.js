import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';

const BASE = '/api';
let failures = 0;

function check(name, cond) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.log(`  ✗ ${name}`);
  }
}

async function run() {
  console.log('\nHealth check');
  const health = await request(app).get(`${BASE}/health`);
  check('GET /api/health returns ok', health.status === 200 && health.body.status === 'ok');

  console.log('\nAuth');
  const login = await request(app).post(`${BASE}/auth/login`).send({
    email: 'admin@example.com',
    password: 'admin123',
  });
  check('login succeeds', login.status === 200 && login.body.token);
  const token = login.body.token;
  const auth = { Authorization: `Bearer ${token}` };

  const bad = await request(app).post(`${BASE}/auth/login`).send({
    email: 'admin@example.com',
    password: 'wrong',
  });
  check('wrong password rejected', bad.status === 401);

  const me = await request(app).get(`${BASE}/auth/me`).set(auth);
  check('GET /api/auth/me works', me.status === 200 && me.body.user.username === 'admin');

  const noAuth = await request(app).get(`${BASE}/exhibits`);
  check('exhibits require auth', noAuth.status === 401);

  const updateMe = await request(app).put(`${BASE}/auth/me`).set(auth).send({ displayName: 'Museum Owner 2', isPublic: true });
  check('update profile works', updateMe.status === 200 && updateMe.body.user.displayName === 'Museum Owner 2');
  // Restore display name
  await request(app).put(`${BASE}/auth/me`).set(auth).send({ displayName: 'Museum Owner' });

  console.log('\nExhibits');
  const create = await request(app).post(`${BASE}/exhibits`).set(auth).send({
    type: 'PROJECT',
    title: 'Smoke Test Project',
    description: 'Created during smoke test',
    date: '2026-05-01',
  });
  check('create exhibit works', create.status === 201 && create.body.exhibit.title === 'Smoke Test Project');
  const exhibitId = create.body.exhibit.id;

  const invalidType = await request(app).post(`${BASE}/exhibits`).set(auth).send({
    type: 'NOT_A_TYPE',
    title: 'Bad',
  });
  check('invalid exhibit type rejected', invalidType.status === 400);

  const list = await request(app).get(`${BASE}/exhibits`).set(auth);
  check('list exhibits works', list.status === 200 && Array.isArray(list.body.exhibits));

  const update = await request(app).put(`${BASE}/exhibits/${exhibitId}`).set(auth).send({ title: 'Updated Title' });
  check('update exhibit works', update.status === 200 && update.body.exhibit.title === 'Updated Title');

  // Image upload is stored in Postgres (BYTEA) and served back from /uploads/:id.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const upload = await request(app)
    .post(`${BASE}/exhibits/${exhibitId}/image`)
    .set(auth)
    .attach('image', png, { filename: 'test.png', contentType: 'image/png' });
  check('upload exhibit image works', upload.status === 200 && upload.body.exhibit.imageUrl === `/uploads/${exhibitId}`);
  check('image upload does not leak bytes in JSON', !('imageData' in upload.body.exhibit) && !('imageMime' in upload.body.exhibit));

  const served = await request(app)
    .get(`/uploads/${exhibitId}`)
    .buffer(true)
    .parse((res, done) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });
  check('served image returns the stored bytes', served.status === 200 && served.body.equals(png));

  console.log('\nPublic museum');
  const museum = await request(app).get(`${BASE}/museum/admin`);
  check('public museum returns exhibits', museum.status === 200 && Array.isArray(museum.body.exhibits));

  const missing = await request(app).get(`${BASE}/museum/does-not-exist`);
  check('missing museum returns 404', missing.status === 404);

  const publicDetail = await request(app).get(`${BASE}/museum/exhibit/${exhibitId}`);
  check('public exhibit detail works', publicDetail.status === 200 && publicDetail.body.exhibit.id === exhibitId);

  console.log('\nTasks');
  const createTask = await request(app).post(`${BASE}/tasks`).set(auth).send({
    title: 'Smoke Test Task',
    dueDate: '2026-06-15',
  });
  check('create task works', createTask.status === 201);
  const taskId = createTask.body.task.id;

  const daily = await request(app).get(`${BASE}/tasks?view=daily&date=2026-06-15`).set(auth);
  check('daily task view works', daily.status === 200 && Array.isArray(daily.body.tasks));

  const weekly = await request(app).get(`${BASE}/tasks?view=weekly&date=2026-06-15`).set(auth);
  check('weekly task view works', weekly.status === 200 && Array.isArray(weekly.body.tasks));

  const monthly = await request(app).get(`${BASE}/tasks?view=monthly&date=2026-06-01`).set(auth);
  check('monthly task view contains task', monthly.status === 200 && monthly.body.tasks.some((t) => t.id === taskId));

  const toggle = await request(app).patch(`${BASE}/tasks/${taskId}`).set(auth).send({ completed: true });
  check('toggle task works', toggle.status === 200 && toggle.body.task.completed === true);

  // Cleanup
  const delExhibit = await request(app).delete(`${BASE}/exhibits/${exhibitId}`).set(auth);
  check('delete exhibit works', delExhibit.status === 204);
  const delTask = await request(app).delete(`${BASE}/tasks/${taskId}`).set(auth);
  check('delete task works', delTask.status === 204);

  console.log(`\n${failures === 0 ? 'ALL SMOKE TESTS PASSED' : `${failures} FAILURES`}`);
  process.exit(failures === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
