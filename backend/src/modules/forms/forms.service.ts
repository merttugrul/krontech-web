import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FormSubmission, FormType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RecaptchaService } from '../../common/recaptcha/recaptcha.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { DemoFormDto } from './dto/demo-form.dto';
import { AdminFormQueryDto } from './dto/query-form.dto';

export interface SubmissionContext {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recaptcha: RecaptchaService,
  ) {}

  async submitContact(dto: ContactFormDto, ctx: SubmissionContext): Promise<{ id: string }> {
    this.assertHoneypotEmpty(dto.website);
    await this.recaptcha.verify(dto.recaptchaToken, ctx.ipAddress);

    const submission = await this.createSubmission(FormType.contact, dto, ctx);
    this.logger.log(`Contact form received (${submission.id}) from ${dto.email}`);
    return { id: submission.id };
  }

  async submitDemo(dto: DemoFormDto, ctx: SubmissionContext): Promise<{ id: string }> {
    this.assertHoneypotEmpty(dto.website);
    await this.recaptcha.verify(dto.recaptchaToken, ctx.ipAddress);

    const submission = await this.createSubmission(FormType.demo, dto, ctx);
    this.logger.log(`Demo request received (${submission.id}) from ${dto.email} / ${dto.company}`);
    return { id: submission.id };
  }

  // ──────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────

  async list(query: AdminFormQueryDto): Promise<{
    items: FormSubmission[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 30;

    const where: Prisma.FormSubmissionWhereInput = {};
    if (query.formType) where.formType = query.formType;
    if (query.fromDate || query.toDate) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (query.fromDate) createdAt.gte = new Date(query.fromDate);
      if (query.toDate) createdAt.lte = new Date(query.toDate);
      where.createdAt = createdAt;
    }
    if (query.search) {
      // JSON kolonu içinde email/name/company araması — Prisma 5 `string_contains`.
      // Çok kompleks search için ayrı text index veya full-text search gerekir (ADIM 20).
      where.OR = [
        { data: { path: ['email'], string_contains: query.search } },
        { data: { path: ['name'], string_contains: query.search } },
        { data: { path: ['company'], string_contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.formSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findById(id: string): Promise<FormSubmission> {
    const submission = await this.prisma.formSubmission.findUnique({ where: { id } });
    if (!submission) throw new NotFoundException(`Submission ${id} not found`);
    return submission;
  }

  async delete(id: string): Promise<{ id: string }> {
    await this.findById(id);
    await this.prisma.formSubmission.delete({ where: { id } });
    return { id };
  }

  // ──────────────────────────────────────
  // PRIVATE
  // ──────────────────────────────────────

  private async createSubmission(
    formType: FormType,
    dto: ContactFormDto | DemoFormDto,
    ctx: SubmissionContext,
  ): Promise<FormSubmission> {
    // recaptchaToken ve honeypot persist etmiyoruz — sadece işleme alanları.
    const { recaptchaToken: _recaptchaToken, website: _website, source, locale, ...data } = dto;
    void _recaptchaToken;
    void _website;

    return this.prisma.formSubmission.create({
      data: {
        formType,
        data: data as unknown as Prisma.InputJsonValue,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        locale,
        source,
      },
    });
  }

  private assertHoneypotEmpty(value: string | undefined): void {
    if (value && value.trim().length > 0) {
      // Bot tuzağı — boş olmalıydı. Gerçek hatayı bot'a vermiyoruz;
      // generic validation gibi davranıyoruz.
      throw new BadRequestException('Invalid submission');
    }
  }
}
