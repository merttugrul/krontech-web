import { z } from 'zod';
import type { Dictionary } from '@/lib/i18n';

/**
 * Contact + Demo form validation şemaları. RHF `zodResolver` ile kullanılır.
 *
 * Tasarım:
 *  - Hata mesajları `Dictionary.contact.validation` üzerinden i18n edilir;
 *    factory fonksiyon locale başına şema üretir.
 *  - `website` alanı honeypot — UI'da gizli, bot doldurursa submission iptal.
 *  - `recaptchaToken` ve `website` alanları backend DTO'da optional — dev/test
 *    modunda reCAPTCHA atlanabildiği için frontend'de de optional bırakıyoruz.
 *  - Telefon için çok gevşek regex: 7-20 karakter, digit/space/+/-/().
 *    Katı E.164 zorunluluğu kullanıcıyı yorar.
 */

const phoneRegex = /^[+\d][\d\s\-().]{6,30}$/;

export function buildContactSchema(dict: Dictionary) {
  const v = dict.contact.validation;
  return z.object({
    name: z
      .string()
      .min(2, v.nameMin)
      .max(120, v.nameMax)
      .trim(),
    email: z.string().email(v.emailInvalid).max(254, v.emailInvalid).trim(),
    company: z
      .string()
      .max(160, v.companyMax)
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined)),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined))
      .refine(
        (val) => val === undefined || phoneRegex.test(val),
        v.phoneInvalid,
      ),
    message: z
      .string()
      .min(10, v.messageMin)
      .max(5000, v.messageMax)
      .trim(),
    /** Honeypot — boş kalmalı. */
    website: z.string().max(200).optional().or(z.literal('')),
  });
}

export function buildDemoSchema(dict: Dictionary) {
  const v = dict.contact.validation;
  return z.object({
    name: z.string().min(2, v.nameMin).max(120, v.nameMax).trim(),
    email: z.string().email(v.emailInvalid).max(254, v.emailInvalid).trim(),
    company: z
      .string({
        required_error: v.companyRequired,
        invalid_type_error: v.companyRequired,
      })
      .min(2, v.companyRequired)
      .max(160, v.companyMax)
      .trim(),
    jobTitle: z
      .string()
      .max(120)
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined)),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined))
      .refine(
        (val) => val === undefined || phoneRegex.test(val),
        v.phoneInvalid,
      ),
    productInterest: z
      .string()
      .max(120)
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined)),
    message: z
      .string()
      .max(5000, v.messageMax)
      .trim()
      .optional()
      .or(z.literal(''))
      .transform((val) => (val ? val : undefined)),
    website: z.string().max(200).optional().or(z.literal('')),
  });
}

export type ContactFormValues = z.infer<ReturnType<typeof buildContactSchema>>;
export type DemoFormValues = z.infer<ReturnType<typeof buildDemoSchema>>;
