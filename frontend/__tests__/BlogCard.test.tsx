import { render, screen } from '@testing-library/react';
import { BlogCard } from '@/components/ui/BlogCard';
import type { BlogListItem } from '@/lib/types';

const base: BlogListItem = {
  id: 'b1',
  slug: 'welcome',
  type: 'blog',
  coverImage: null,
  publishedAt: '2026-03-10T00:00:00.000Z',
  isHighlight: false,
  viewCount: 0,
  author: null,
  title: 'Welcome to Kron',
  excerpt: 'First post on the new platform.',
  ogImage: null,
};

describe('<BlogCard />', () => {
  it('başlık, excerpt ve type badge render edilir', () => {
    render(<BlogCard post={base} locale="en" readMoreLabel="Read more" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Welcome to Kron' })).toBeInTheDocument();
    expect(screen.getByText(/First post/)).toBeInTheDocument();
    expect(screen.getByText('blog')).toBeInTheDocument();
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });

  it('publishedAt varsa <time> elementi doğru dateTime içerir', () => {
    const { container } = render(
      <BlogCard post={base} locale="en" readMoreLabel="Read more" />,
    );
    const timeEl = container.querySelector('time');
    expect(timeEl).not.toBeNull();
    expect(timeEl?.getAttribute('dateTime')).toBe('2026-03-10T00:00:00.000Z');
  });

  it('publishedAt null ise <time> render edilmez', () => {
    const { container } = render(
      <BlogCard
        post={{ ...base, publishedAt: null }}
        locale="en"
        readMoreLabel="Read more"
      />,
    );
    expect(container.querySelector('time')).toBeNull();
  });

  it('TR locale için href /tr prefix alır', () => {
    render(<BlogCard post={base} locale="tr" readMoreLabel="Devam" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tr/blog/welcome');
  });
});
