import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FormType } from '@prisma/client';
import { FormsService } from './forms.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { DemoFormDto } from './dto/demo-form.dto';

describe('FormsService', () => {
  let service: FormsService;
  let prisma: { formSubmission: Record<string, jest.Mock> };
  let recaptcha: { verify: jest.Mock };

  const baseContact: ContactFormDto = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Interested in PAM solution for our company.',
  };

  const baseDemo: DemoFormDto = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    company: 'Acme Corp',
  };

  beforeEach(async () => {
    prisma = {
      formSubmission: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    recaptcha = { verify: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RecaptchaService, useValue: recaptcha },
      ],
    }).compile();

    service = module.get(FormsService);
  });

  describe('submitContact', () => {
    it('honeypot dolu → BadRequestException (bot)', async () => {
      await expect(
        service.submitContact({ ...baseContact, website: 'spam.com' }, {}),
      ).rejects.toThrow(BadRequestException);
      expect(recaptcha.verify).not.toHaveBeenCalled();
      expect(prisma.formSubmission.create).not.toHaveBeenCalled();
    });

    it('recaptcha fail → UnauthorizedException propagate', async () => {
      recaptcha.verify.mockRejectedValue(new UnauthorizedException('bot'));
      await expect(service.submitContact(baseContact, {})).rejects.toThrow(UnauthorizedException);
    });

    it('başarılı submission → create + id döner', async () => {
      prisma.formSubmission.create.mockResolvedValue({ id: 's1' });

      const result = await service.submitContact(baseContact, {
        ipAddress: '1.2.3.4',
        userAgent: 'curl/8',
      });

      expect(result).toEqual({ id: 's1' });
      expect(prisma.formSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formType: FormType.contact,
          ipAddress: '1.2.3.4',
          userAgent: 'curl/8',
          data: expect.objectContaining({
            email: 'john@example.com',
            name: 'John Doe',
          }),
        }),
      });
    });

    it("recaptchaToken + website alanları DB'ye yazılmaz", async () => {
      prisma.formSubmission.create.mockResolvedValue({ id: 's1' });

      await service.submitContact({ ...baseContact, recaptchaToken: 'captcha-tok' }, {});

      const arg = prisma.formSubmission.create.mock.calls[0][0] as {
        data: { data: Record<string, unknown> };
      };
      expect(arg.data.data).not.toHaveProperty('recaptchaToken');
      expect(arg.data.data).not.toHaveProperty('website');
    });
  });

  describe('submitDemo', () => {
    it('başarılı demo → formType=demo', async () => {
      prisma.formSubmission.create.mockResolvedValue({ id: 'd1' });

      await service.submitDemo(baseDemo, { ipAddress: '5.5.5.5' });

      expect(prisma.formSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          formType: FormType.demo,
          ipAddress: '5.5.5.5',
        }),
      });
    });
  });

  describe('list', () => {
    it('filter + pagination', async () => {
      prisma.formSubmission.findMany.mockResolvedValue([]);
      prisma.formSubmission.count.mockResolvedValue(0);

      await service.list({
        formType: FormType.demo,
        page: 2,
        pageSize: 10,
        fromDate: '2026-01-01T00:00:00Z',
      });

      expect(prisma.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: expect.objectContaining({
            formType: FormType.demo,
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });

  describe('findById / delete', () => {
    it('olmayan → NotFoundException', async () => {
      prisma.formSubmission.findUnique.mockResolvedValue(null);
      await expect(service.findById('ghost')).rejects.toThrow(NotFoundException);
      await expect(service.delete('ghost')).rejects.toThrow(NotFoundException);
    });

    it('başarılı delete', async () => {
      prisma.formSubmission.findUnique.mockResolvedValue({ id: 's1' });
      prisma.formSubmission.delete.mockResolvedValue({});

      const result = await service.delete('s1');
      expect(result).toEqual({ id: 's1' });
    });
  });
});
