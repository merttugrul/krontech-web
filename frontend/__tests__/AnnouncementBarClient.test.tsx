import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  AnnouncementBarClient,
  announcementDismissedStorageKey,
} from '@/components/layout/AnnouncementBarClient';
import type { AnnouncementBar } from '@/lib/types';

const sample: AnnouncementBar = {
  id: 'ann-1',
  locale: 'en',
  text: 'Join our live demo on Friday',
  linkUrl: '/events/demo',
  linkLabel: 'Register',
  isActive: true,
  startDate: null,
  endDate: null,
};

describe('<AnnouncementBarClient />', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('metin ve link düzgün render edilir', () => {
    render(<AnnouncementBarClient data={sample} dismissLabel="Dismiss" />);
    expect(screen.getByText(/Join our live demo/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Register' });
    expect(link).toHaveAttribute('href', '/events/demo');
  });

  it('dismiss ikonuna tıklayınca bant kaybolur ve localStorage set edilir', () => {
    render(<AnnouncementBarClient data={sample} dismissLabel="Dismiss" />);
    const btn = screen.getByRole('button', { name: 'Dismiss' });

    act(() => {
      fireEvent.click(btn);
    });

    expect(screen.queryByTestId('announcement-bar')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(announcementDismissedStorageKey('ann-1'))).toBe('true');
  });

  it('localStorage önceden aynı id için dismissed ise hiç render edilmez', () => {
    window.localStorage.setItem(announcementDismissedStorageKey('ann-1'), 'true');
    render(<AnnouncementBarClient data={sample} dismissLabel="Dismiss" />);

    // hydrate sonrası dismiss devreye girdikten sonra bant gitmeli
    return Promise.resolve().then(() => {
      expect(screen.queryByTestId('announcement-bar')).not.toBeInTheDocument();
    });
  });

  it('farklı duyuru id degeri localStorage dismiss kaydini gecersiz sayar', () => {
    window.localStorage.setItem(announcementDismissedStorageKey('eski-duyuru'), 'true');
    render(<AnnouncementBarClient data={sample} dismissLabel="Dismiss" />);
    expect(screen.getByTestId('announcement-bar')).toBeInTheDocument();
  });
});
