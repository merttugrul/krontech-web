import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { resetDatabase, seedUsers } from './helpers/db.helper';
import { authed, login } from './helpers/auth.helper';

describe('Forms module (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let editorToken: string;

  beforeAll(async () => {
    const { app: a } = await createTestApp();
    app = a;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    const users = await seedUsers(prisma);
    adminToken = (await login(app, users.admin.email, users.admin.password)).accessToken;
    editorToken = (await login(app, users.editor.email, users.editor.password)).accessToken;
  });

  describe('POST /api/forms/contact (public)', () => {
    it('geçerli payload → 201 + DB kaydı', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/forms/contact')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Acme',
          message: 'Interested in PAM solution for our company.',
          source: '/contact',
          locale: 'en',
        })
        .expect(201);

      expect(res.body.id).toBeDefined();

      const sub = await prisma.formSubmission.findUnique({
        where: { id: res.body.id },
      });
      expect(sub).not.toBeNull();
      expect(sub?.formType).toBe('contact');
    });

    it('invalid email → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/forms/contact')
        .send({ name: 'John', email: 'not-an-email', message: 'Long enough message' })
        .expect(400);
    });

    it('kısa message → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/forms/contact')
        .send({ name: 'J', email: 'a@b.com', message: 'hi' })
        .expect(400);
    });

    it('honeypot (website) dolu → 400 (bot)', async () => {
      await request(app.getHttpServer())
        .post('/api/forms/contact')
        .send({
          name: 'John',
          email: 'john@example.com',
          message: 'Long enough message body',
          website: 'spam-bot-filled-this',
        })
        .expect(400);

      const count = await prisma.formSubmission.count();
      expect(count).toBe(0);
    });

    it("recaptchaToken ve website DB'ye yazılmaz", async () => {
      const res = await request(app.getHttpServer())
        .post('/api/forms/contact')
        .send({
          name: 'John',
          email: 'john@example.com',
          message: 'Long enough message body',
          recaptchaToken: 'faketoken',
        })
        .expect(201);

      const sub = await prisma.formSubmission.findUnique({
        where: { id: res.body.id },
      });
      const data = sub?.data as Record<string, unknown>;
      expect(data).not.toHaveProperty('recaptchaToken');
      expect(data).not.toHaveProperty('website');
    });
  });

  describe('POST /api/forms/demo (public)', () => {
    it('geçerli payload → 201 + formType=demo', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/forms/demo')
        .send({
          name: 'Jane',
          email: 'jane@acme.com',
          company: 'Acme Corp',
          jobTitle: 'CTO',
          productInterest: 'PAM',
        })
        .expect(201);

      const sub = await prisma.formSubmission.findUnique({
        where: { id: res.body.id },
      });
      expect(sub?.formType).toBe('demo');
    });

    it('company zorunlu', async () => {
      await request(app.getHttpServer())
        .post('/api/forms/demo')
        .send({ name: 'Jane', email: 'jane@acme.com' })
        .expect(400);
    });
  });

  describe('GET /api/admin/forms (admin list)', () => {
    it('auth yok → 401', async () => {
      await request(app.getHttpServer()).get('/api/admin/forms').expect(401);
    });

    it('admin + editor listeleyebilir', async () => {
      await prisma.formSubmission.createMany({
        data: [
          {
            formType: 'contact',
            data: { name: 'A', email: 'a@x.com', message: 'hi' },
          },
          {
            formType: 'demo',
            data: { name: 'B', email: 'b@x.com', company: 'Co' },
          },
        ],
      });

      const res = await authed(app, editorToken).get('/api/admin/forms').expect(200);
      expect(res.body.total).toBe(2);
    });

    it('formType filter → sadece demo', async () => {
      await prisma.formSubmission.createMany({
        data: [
          {
            formType: 'contact',
            data: { name: 'A', email: 'a@x.com', message: 'hi' },
          },
          {
            formType: 'demo',
            data: { name: 'B', email: 'b@x.com', company: 'Co' },
          },
        ],
      });

      const res = await authed(app, adminToken).get('/api/admin/forms?formType=demo').expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.items[0].formType).toBe('demo');
    });
  });

  describe('DELETE /api/admin/forms/:id', () => {
    it('editor → 403 (admin only — GDPR)', async () => {
      const sub = await prisma.formSubmission.create({
        data: {
          formType: 'contact',
          data: { email: 'x@y.com', name: 'X', message: 'hi there' },
        },
      });
      await authed(app, editorToken).delete(`/api/admin/forms/${sub.id}`).expect(403);
    });

    it('admin → 200 + kayıt silinir', async () => {
      const sub = await prisma.formSubmission.create({
        data: {
          formType: 'contact',
          data: { email: 'x@y.com', name: 'X', message: 'hi there' },
        },
      });
      await authed(app, adminToken).delete(`/api/admin/forms/${sub.id}`).expect(200);

      const count = await prisma.formSubmission.count();
      expect(count).toBe(0);
    });
  });
});
