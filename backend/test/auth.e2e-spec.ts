import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { closeTestApp, createTestApp } from './helpers/app.helper';
import { login } from './helpers/auth.helper';
import { resetDatabase, seedUsers, SeedUsers } from './helpers/db.helper';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: SeedUsers;

  beforeAll(async () => {
    const created = await createTestApp();
    app = created.app;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    users = await seedUsers(prisma);
  });

  describe('POST /api/auth/login', () => {
    it('geçerli credentials → 200 + tokenlar + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: users.admin.email, password: users.admin.password })
        .expect(200);

      expect(res.body.tokens).toBeDefined();
      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
      expect(res.body.tokens.refreshToken).toEqual(expect.any(String));
      expect(res.body.tokens.expiresIn).toBeGreaterThan(0);
      expect(res.body.user).toMatchObject({
        id: users.admin.id,
        email: users.admin.email,
        role: 'admin',
      });
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('yanlış şifre → 401 + generic error (username enumeration koruması)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: users.admin.email, password: 'WrongPassword1' })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('olmayan kullanıcı → 401 + aynı generic mesaj', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'Anything123' })
        .expect(401);

      expect(res.body.message).toBe('Invalid email or password');
    });

    it('geçersiz email formatı → 400 ValidationPipe', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'Short1aa' })
        .expect(400);
    });

    it('kısa şifre (< 8) → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'a@b.c', password: 'short' })
        .expect(400);
    });

    it('pasif kullanıcı (isActive=false) → 401', async () => {
      await prisma.user.update({
        where: { id: users.admin.id },
        data: { isActive: false },
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: users.admin.email, password: users.admin.password })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('token yok → 401', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('geçersiz token → 401', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('geçerli token → 200 + user bilgisi (passwordHash yok)', async () => {
      const { accessToken } = await login(app, users.admin.email, users.admin.password);
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({
        id: users.admin.id,
        email: users.admin.email,
        role: 'admin',
      });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('geçerli refresh token → 200 + yeni access token', async () => {
      const { refreshToken } = await login(app, users.admin.email, users.admin.password);

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.tokens.accessToken).toEqual(expect.any(String));
    });

    it('access token ile refresh yapılırsa → 401 (type check)', async () => {
      const { accessToken } = await login(app, users.admin.email, users.admin.password);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: accessToken })
        .expect(401);
    });

    it('geçersiz JWT → 400 (ValidationPipe IsJWT)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'not-a-jwt-at-all' })
        .expect(400);
    });
  });
});
