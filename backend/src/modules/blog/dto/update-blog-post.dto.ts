import { PartialType } from '@nestjs/swagger';
import { CreateBlogPostDto } from './create-blog-post.dto';

/**
 * PATCH için: tüm alanlar opsiyonel.
 * `translations` gönderilirse → upsert (blogPostId + locale bazlı).
 */
export class UpdateBlogPostDto extends PartialType(CreateBlogPostDto) {}
