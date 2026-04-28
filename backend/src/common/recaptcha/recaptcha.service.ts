import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface GoogleVerifyResponse {
  success: boolean;
  score?: number; // v3 için
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Google reCAPTCHA v2 / v3 doğrulama.
 *
 * Policy:
 * - Test ortamında (`NODE_ENV=test`) verify skip edilir — aksi halde e2e
 *   testler hızlı çalışamaz ve CI'da dış servise bağımlı kalır.
 * - `RECAPTCHA_SECRET` boşsa "dev mode" → token yoksa 401, varsa pass
 *   (Google'a istek atmaz). Production'da mutlaka set edilmeli.
 * - v3 score döndürürse `minScore` altındaki submission'lar bot sayılır.
 */
@Injectable()
export class RecaptchaService {
  private readonly logger = new Logger(RecaptchaService.name);
  private readonly secret: string | undefined;
  private readonly client: AxiosInstance;
  private readonly minScore = 0.5;

  constructor(private readonly config: ConfigService) {
    this.secret = this.config.get<string>('RECAPTCHA_SECRET')?.trim();
    this.client = axios.create({
      baseURL: 'https://www.google.com/recaptcha/api',
      timeout: 5000,
    });
  }

  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (this.isTestEnv()) {
      return;
    }

    if (!this.secret || this.secret === '' || this.secret === 'your_recaptcha_secret_here') {
      this.logger.warn(
        "RECAPTCHA_SECRET set edilmemiş — doğrulama atlanıyor. Production'da mutlaka set edin.",
      );
      return;
    }

    if (!token) {
      throw new UnauthorizedException('reCAPTCHA token gerekli');
    }

    try {
      const { data } = await this.client.post<GoogleVerifyResponse>('/siteverify', null, {
        params: {
          secret: this.secret,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        },
      });

      if (!data.success) {
        this.logger.warn(`reCAPTCHA verify reddetti: ${(data['error-codes'] ?? []).join(', ')}`);
        throw new UnauthorizedException('reCAPTCHA doğrulaması başarısız');
      }

      if (typeof data.score === 'number' && data.score < this.minScore) {
        this.logger.warn(`reCAPTCHA v3 düşük skor: ${data.score}`);
        throw new UnauthorizedException('reCAPTCHA skoru düşük — bot şüphesi');
      }
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error(`reCAPTCHA verify hatası: ${(err as Error).message}`);
      throw new UnauthorizedException('reCAPTCHA servisi yanıt vermedi');
    }
  }

  private isTestEnv(): boolean {
    return this.config.get<string>('NODE_ENV') === 'test';
  }
}
