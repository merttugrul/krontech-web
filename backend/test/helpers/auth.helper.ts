import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * E2E testlerde auth endpoint'ini kullanarak token alır.
 * Gerçek login flow'u test eder, sahte token üretmez.
 */
export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; userId: string }> {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login başarısız (${res.status}): ${JSON.stringify(res.body)}`);
  }

  return {
    accessToken: res.body.tokens.accessToken,
    refreshToken: res.body.tokens.refreshToken,
    userId: res.body.user.id,
  };
}

/**
 * Authorization header'ı otomatik ekleyen supertest wrapper.
 * Kullanım:
 *   const tokens = await login(app, ...);
 *   await authed(app, tokens.accessToken).get('/api/admin/products');
 */
export function authed(app: INestApplication, token: string) {
  const agent = request(app.getHttpServer());
  return {
    get: (url: string) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => agent.post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => agent.patch(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => agent.put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => agent.delete(url).set('Authorization', `Bearer ${token}`),
  };
}
