import { sanitizeContent } from '@/lib/sanitize';

interface BlogArticleProps {
  html: string;
}

/**
 * Sanitize edilmiş blog HTML'ini `prose` tipografisiyle render eder.
 * Tailwind Typography plugin'i (ADIM 15'te eklendi) `<h1>..<h6>`, `<p>`,
 * `<a>`, `<blockquote>` gibi elementleri otomatik stiller.
 *
 * Dark link renklerini override edip Krontech accent'ına çekiyoruz.
 */
export function BlogArticle({ html }: BlogArticleProps) {
  const clean = sanitizeContent(html);
  return (
    <div
      className="prose prose-slate prose-lg max-w-none prose-headings:text-kron-dark prose-a:text-kron-accent prose-a:no-underline hover:prose-a:underline prose-strong:text-kron-dark prose-blockquote:border-kron-accent prose-code:text-kron-blue prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-xl"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
