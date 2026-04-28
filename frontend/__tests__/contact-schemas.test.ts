import { buildContactSchema, buildDemoSchema } from '@/lib/schemas/contact';
import { getDictionary } from '@/lib/i18n';

const dict = getDictionary('en');

describe('buildContactSchema', () => {
  const schema = buildContactSchema(dict);

  it('geçerli minimal payload parse edilir', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Please get in touch about enterprise licensing options.',
    });
    expect(result.success).toBe(true);
  });

  it('boş company/phone transform sonrası undefined olur', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: '',
      phone: '',
      message: 'Hello there, I would like to inquire about pricing details.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.company).toBeUndefined();
      expect(result.data.phone).toBeUndefined();
    }
  });

  it('name çok kısaysa nameMin hatası döner', () => {
    const result = schema.safeParse({
      name: 'J',
      email: 'jane@example.com',
      message: 'I want to talk about enterprise licensing.',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.find((e) => e.path[0] === 'name')?.message;
      expect(msg).toBe(dict.contact.validation.nameMin);
    }
  });

  it('geçersiz email emailInvalid hatası döner', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'not-an-email',
      message: 'Some long enough message text here please',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.find((e) => e.path[0] === 'email')?.message;
      expect(msg).toBe(dict.contact.validation.emailInvalid);
    }
  });

  it('çok kısa message messageMin hatası döner', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.find((e) => e.path[0] === 'message')?.message;
      expect(msg).toBe(dict.contact.validation.messageMin);
    }
  });

  it('phone geçersiz formatta hata üretir', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: 'abc',
      message: 'Some valid long enough message for testing.',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.errors.some((e) => e.path[0] === 'phone'),
      ).toBe(true);
    }
  });

  it('phone `+90 555 000 00 00` formatı geçerli', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+90 555 000 00 00',
      message: 'Some valid long enough message for testing.',
    });
    expect(result.success).toBe(true);
  });
});

describe('buildDemoSchema', () => {
  const schema = buildDemoSchema(dict);

  it('company zorunlu — eksikse companyRequired hatası döner', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.find((e) => e.path[0] === 'company')?.message;
      expect(msg).toBe(dict.contact.validation.companyRequired);
    }
  });

  it('minimal valid payload (name/email/company) kabul edilir', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBeUndefined();
      expect(result.data.jobTitle).toBeUndefined();
      expect(result.data.productInterest).toBeUndefined();
    }
  });

  it('tüm opsiyonel alanlarla valid payload parse edilir', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      jobTitle: 'CTO',
      phone: '+1 555 000 0000',
      productInterest: 'Single Connect',
      message: 'We would like a demo next week.',
    });
    expect(result.success).toBe(true);
  });

  it('message çok uzunsa messageMax hatası döner', () => {
    const result = schema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme Inc.',
      message: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.errors.find((e) => e.path[0] === 'message')?.message;
      expect(msg).toBe(dict.contact.validation.messageMax);
    }
  });
});
