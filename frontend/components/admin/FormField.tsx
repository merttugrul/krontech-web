'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
}

const fieldClass =
  'w-full rounded-lg border border-kron-light bg-white px-3 py-2 text-sm text-kron-dark outline-none transition focus:border-kron-blue focus:ring-2 focus:ring-kron-blue/20 disabled:bg-kron-light/40 disabled:text-kron-gray';

function FieldShell({
  label,
  id,
  hint,
  error,
  required,
  optional,
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  const describedBy: string[] = [];
  if (hint) describedBy.push(`${id}-hint`);
  if (error) describedBy.push(`${id}-error`);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-kron-dark">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {optional && (
          <span className="text-[11px] uppercase tracking-wider text-kron-gray">
            İsteğe bağlı
          </span>
        )}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-kron-gray">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export const AdminInput = forwardRef<
  HTMLInputElement,
  BaseProps & InputHTMLAttributes<HTMLInputElement>
>(function AdminInput({ label, hint, error, required, optional, id, className, ...rest }, ref) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
    >
      <input
        id={fieldId}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[hint ? `${fieldId}-hint` : null, error ? `${fieldId}-error` : null]
          .filter(Boolean)
          .join(' ') || undefined}
        className={cn(fieldClass, error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20', className)}
        {...rest}
      />
    </FieldShell>
  );
});

export const AdminTextarea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function AdminTextarea(
  { label, hint, error, required, optional, id, className, rows = 4, ...rest },
  ref,
) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
    >
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn(fieldClass, 'resize-y', error && 'border-red-300 focus:border-red-500 focus:ring-red-500/20', className)}
        {...rest}
      />
    </FieldShell>
  );
});

export const AdminSelect = forwardRef<
  HTMLSelectElement,
  BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>
>(function AdminSelect({ label, hint, error, required, optional, id, className, children, ...rest }, ref) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
    >
      <select
        id={fieldId}
        ref={ref}
        className={cn(fieldClass, error && 'border-red-300', className)}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export function AdminCheckbox({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = rest.id ?? rest.name ?? label;
  return (
    <label htmlFor={id} className="flex items-start gap-2.5 text-sm">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-kron-light text-kron-blue focus:ring-kron-blue/30"
        {...rest}
      />
      <span>
        <span className="font-medium text-kron-dark">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-kron-gray">{hint}</span>}
      </span>
    </label>
  );
}
