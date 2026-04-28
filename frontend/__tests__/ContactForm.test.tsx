import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from '@/components/forms/ContactForm';
import { getDictionary } from '@/lib/i18n';

// ─────────────────────────────────────
// Mocks
// ─────────────────────────────────────

const executeRecaptcha = jest.fn().mockResolvedValue('fake-token');

jest.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha }),
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const apiPost = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { post: (...args: unknown[]) => apiPost(...args) },
}));

beforeEach(() => {
  apiPost.mockReset();
  executeRecaptcha.mockClear();
});

// ─────────────────────────────────────
// Tests
// ─────────────────────────────────────

describe('<ContactForm />', () => {
  const dict = getDictionary('en');

  it('tüm zorunlu alanlar ve submit butonu render edilir', () => {
    render(<ContactForm locale="en" dict={dict} />);
    expect(screen.getByLabelText(dict.contact.fieldName)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.contact.fieldEmail)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.contact.fieldMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: dict.contact.submitContact }),
    ).toBeInTheDocument();
  });

  it('geçersiz e-posta ile submit edilince validation hatası gösterilir', async () => {
    const user = userEvent.setup();
    render(<ContactForm locale="en" dict={dict} />);

    await user.type(screen.getByLabelText(dict.contact.fieldName), 'Jane Doe');
    await user.type(screen.getByLabelText(dict.contact.fieldEmail), 'bad');
    await user.type(
      screen.getByLabelText(dict.contact.fieldMessage),
      'Message with enough characters to pass minimum.',
    );
    await user.click(
      screen.getByRole('button', { name: dict.contact.submitContact }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(dict.contact.validation.emailInvalid),
      ).toBeInTheDocument();
    });
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('happy path: doğru veriyle submit sonrası success kart gösterilir', async () => {
    apiPost.mockResolvedValueOnce({ data: { id: 'sub-1' } });
    const user = userEvent.setup();
    render(<ContactForm locale="en" dict={dict} />);

    await user.type(screen.getByLabelText(dict.contact.fieldName), 'Jane Doe');
    await user.type(
      screen.getByLabelText(dict.contact.fieldEmail),
      'jane@example.com',
    );
    await user.type(
      screen.getByLabelText(dict.contact.fieldMessage),
      'Please reach out with pricing details, thanks.',
    );
    await user.click(
      screen.getByRole('button', { name: dict.contact.submitContact }),
    );

    await waitFor(() =>
      expect(screen.getByText(dict.contact.successTitle)).toBeInTheDocument(),
    );
    expect(apiPost).toHaveBeenCalledWith(
      '/forms/contact',
      expect.objectContaining({
        name: 'Jane Doe',
        email: 'jane@example.com',
        recaptchaToken: 'fake-token',
        locale: 'en',
        source: 'contact_page',
      }),
    );
  });

  it('API 429 hatasında rate-limit mesajı gösterilir', async () => {
    apiPost.mockRejectedValueOnce(
      Object.assign(new Error('429'), {
        isAxiosError: true,
        response: { status: 429 },
        name: 'AxiosError',
      }),
    );
    // Real AxiosError instanceof check works via jest mock — hence import.
    const { AxiosError } = await import('axios');
    apiPost.mockReset();
    const axiosErr = new AxiosError('rate limited');
    axiosErr.response = { status: 429, data: {}, statusText: '', headers: {}, config: {} as never };
    apiPost.mockRejectedValueOnce(axiosErr);

    const user = userEvent.setup();
    render(<ContactForm locale="en" dict={dict} />);

    await user.type(screen.getByLabelText(dict.contact.fieldName), 'Jane Doe');
    await user.type(
      screen.getByLabelText(dict.contact.fieldEmail),
      'jane@example.com',
    );
    await user.type(
      screen.getByLabelText(dict.contact.fieldMessage),
      'Please reach out with pricing details, thanks.',
    );
    await user.click(
      screen.getByRole('button', { name: dict.contact.submitContact }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(dict.contact.errorRateLimited),
      ).toBeInTheDocument(),
    );
  });
});
