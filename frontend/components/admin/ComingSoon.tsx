interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-kron-light bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-kron-blue/10 to-kron-accent/10 text-kron-blue">
        <svg viewBox="0 0 20 20" className="h-6 w-6" fill="none" aria-hidden>
          <path
            d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 4v4l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-kron-navy">{title}</h2>
      <p className="mt-1 text-sm text-kron-gray">
        {description ??
          'Bu modül FAZ 2 kapsamında yakında eklenecek. Şu an backend endpoint\'lerine Swagger UI üzerinden erişebilirsiniz.'}
      </p>
      <a
        href="http://localhost:4000/api/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex text-xs font-medium text-kron-blue hover:underline"
      >
        Swagger → /api/docs
      </a>
    </div>
  );
}
