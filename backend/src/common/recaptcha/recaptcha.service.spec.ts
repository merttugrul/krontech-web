import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecaptchaService } from './recaptcha.service';

// axios'u tamamen mock'luyoruz — gerçek HTTP çağrısı yapmayalım.
jest.mock('axios', () => {
  const mockInstance = { post: jest.fn() };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockInstance),
    },
    create: jest.fn(() => mockInstance),
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
import axios from 'axios';

describe('RecaptchaService', () => {
  const originalEnv = process.env.NODE_ENV;
  let service: RecaptchaService;
  let configGet: jest.Mock;
  let mockPost: jest.Mock;

  async function build(configMap: Record<string, string>): Promise<void> {
    configGet = jest.fn((key: string) => configMap[key]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecaptchaService, { provide: ConfigService, useValue: { get: configGet } }],
    }).compile();
    service = module.get(RecaptchaService);

    const axiosModule = axios as unknown as { create: jest.Mock };
    const instance = axiosModule.create.mock.results.at(-1)?.value as {
      post: jest.Mock;
    };
    mockPost = instance.post;
  }

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  it('NODE_ENV=test → verify hiçbir şey yapmadan geçer', async () => {
    await build({ NODE_ENV: 'test', RECAPTCHA_SECRET: 'real-secret' });
    await expect(service.verify(undefined)).resolves.toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('prod + token yok → UnauthorizedException', async () => {
    await build({ NODE_ENV: 'production', RECAPTCHA_SECRET: 'real' });
    await expect(service.verify(undefined)).rejects.toThrow(UnauthorizedException);
  });

  it('prod + secret boş → warn + pass (dev fallback)', async () => {
    await build({ NODE_ENV: 'production' });
    await expect(service.verify('some-token')).resolves.toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('prod + secret placeholder → warn + pass', async () => {
    await build({
      NODE_ENV: 'production',
      RECAPTCHA_SECRET: 'your_recaptcha_secret_here',
    });
    await expect(service.verify('tok')).resolves.toBeUndefined();
  });

  it('Google success=true → geçer', async () => {
    await build({ NODE_ENV: 'production', RECAPTCHA_SECRET: 'real' });
    mockPost.mockResolvedValue({ data: { success: true } });

    await expect(service.verify('tok', '1.2.3.4')).resolves.toBeUndefined();
    expect(mockPost).toHaveBeenCalledWith(
      '/siteverify',
      null,
      expect.objectContaining({
        params: expect.objectContaining({
          secret: 'real',
          response: 'tok',
          remoteip: '1.2.3.4',
        }),
      }),
    );
  });

  it('Google success=false → UnauthorizedException', async () => {
    await build({ NODE_ENV: 'production', RECAPTCHA_SECRET: 'real' });
    mockPost.mockResolvedValue({
      data: { success: false, 'error-codes': ['invalid-input-response'] },
    });

    await expect(service.verify('tok')).rejects.toThrow(UnauthorizedException);
  });

  it('v3 düşük skor → UnauthorizedException', async () => {
    await build({ NODE_ENV: 'production', RECAPTCHA_SECRET: 'real' });
    mockPost.mockResolvedValue({ data: { success: true, score: 0.2 } });

    await expect(service.verify('tok')).rejects.toThrow(UnauthorizedException);
  });

  it('axios exception → UnauthorizedException (servis yanıt vermedi)', async () => {
    await build({ NODE_ENV: 'production', RECAPTCHA_SECRET: 'real' });
    mockPost.mockRejectedValue(new Error('timeout'));

    await expect(service.verify('tok')).rejects.toThrow(UnauthorizedException);
  });
});
