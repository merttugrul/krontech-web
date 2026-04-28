'use client';

import type { ReactNode } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

/**
 * Forms çevresine Google reCAPTCHA v3 provider'ını **shartlı** sarar.
 *
 * Dev/test ortamında `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` set değilse provider
 * eklenmez — zira backend da `RECAPTCHA_SECRET` yoksa doğrulamayı atlar
 * (ADIM 7). Böylece local geliştirmede reCAPTCHA bağımlılığı olmaz.
 *
 * Prod'da key doluysa provider tüm child'ları sarar; child'lar
 * `useGoogleReCaptcha()` hook'u ile `executeRecaptcha('contact_submit')`
 * çağırarak token alır.
 */
export function RecaptchaWrapper({ children }: { children: ReactNode }) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey || siteKey.includes('YOUR_SITE_KEY')) {
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
