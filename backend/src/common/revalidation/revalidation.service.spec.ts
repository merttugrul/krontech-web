import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RevalidationService } from './revalidation.service';

jest.mock('axios');

describe('RevalidationService', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let postMock: jest.Mock;

  const buildService = (overrides: Partial<Record<string, string>> = {}): RevalidationService => {
    const defaults: Record<string, string> = {
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
      REVALIDATION_SECRET: 'test-secret',
    };
    const merged = { ...defaults, ...overrides };
    const config = {
      get: jest.fn((key: string, def?: string) => merged[key] ?? def),
    } as unknown as ConfigService;
    return new RevalidationService(config);
  };

  beforeEach(() => {
    postMock = jest.fn().mockResolvedValue({ status: 200 });
    (axios.create as jest.Mock) = jest.fn().mockReturnValue({ post: postMock });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('NODE_ENV=test → hiç istek atmaz', async () => {
    const svc = buildService({ NODE_ENV: 'test' });
    await svc.revalidateTags(['products']);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('boş tags → istek atmaz', async () => {
    const svc = buildService();
    await svc.revalidateTags([]);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('siteUrl yok → skip', async () => {
    const svc = buildService({ NEXT_PUBLIC_SITE_URL: '' });
    await svc.revalidateTags(['products']);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('secret yok → skip', async () => {
    const svc = buildService({ REVALIDATION_SECRET: '' });
    await svc.revalidateTags(['products']);
    expect(postMock).not.toHaveBeenCalled();
  });

  it("normal akış → POST /api/revalidate çağrılır, secret body'de", async () => {
    const svc = buildService();
    await svc.revalidateTags(['products', 'blog']);

    expect(postMock).toHaveBeenCalledWith('http://localhost:3000/api/revalidate', {
      tags: ['products', 'blog'],
      secret: 'test-secret',
    });
  });

  it("trailing slash base URL'de temizlenir", async () => {
    const svc = buildService({ NEXT_PUBLIC_SITE_URL: 'https://kron.com.tr/' });
    await svc.revalidatePaths(['/foo']);

    expect(postMock).toHaveBeenCalledWith('https://kron.com.tr/api/revalidate', {
      paths: ['/foo'],
      secret: 'test-secret',
    });
  });

  it('revalidate() tag+path birleşik', async () => {
    const svc = buildService();
    await svc.revalidate({ tags: ['blog'], paths: ['/blog/x'] });

    expect(postMock).toHaveBeenCalledWith('http://localhost:3000/api/revalidate', {
      tags: ['blog'],
      paths: ['/blog/x'],
      secret: 'test-secret',
    });
  });

  it('fire-and-forget: axios hata atarsa exception propagate olmaz', async () => {
    postMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const svc = buildService();
    await expect(svc.revalidateTags(['products'])).resolves.toBeUndefined();
  });

  it('hem tag hem path boşsa istek atmaz', async () => {
    const svc = buildService();
    await svc.revalidate({ tags: [], paths: [] });
    expect(postMock).not.toHaveBeenCalled();
  });
});
