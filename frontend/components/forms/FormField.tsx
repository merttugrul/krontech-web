import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BaseProps {
  label: string;
  error?: string;
  optionalLabel?: string;
  helpText?: string;
}

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

const baseInputClass =
  'mt-1 block w-full rounded-md border bg-white px-3.5 py-2.5 text-kron-dark shadow-sm transition-colors placeholder:text-slate-400 focus:outline-none focus-visible:border-kron-accent focus-visible:ring-2 focus-visible:ring-kron-accent/30';

function cls(hasError: boolean) {
  return cn(
    baseInputClass,
    hasError
      ? 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/30'
      : 'border-slate-300',
  );
}

/**
 * Tek bir form alanı (label + input/textarea + error + help text).
 *
 * - `optional` ise label yanında küçük "opsiyonel" rozeti.
 * - `error` varsa input kırmızıya çevrilir ve error metni altta gösterilir.
 * - `helpText` (ör. reCAPTCHA privacy notice) input altında görünür.
 */
export const FormField = forwardRef<HTMLInputElement, InputProps>(
  function FormField({ label, error, optionalLabel, helpText, id, required, className, ...rest }, ref) {
    const inputId = id ?? rest.name;
    const errorId = error ? `${inputId}-error` : undefined;
    return (
      <div className={className}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-kron-dark"
        >
          {label}
          {!required && optionalLabel ? (
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({optionalLabel})
            </span>
          ) : null}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId}
          className={cls(Boolean(error))}
          required={required}
          {...rest}
        />
        {helpText ? (
          <p className="mt-1 text-xs text-slate-500">{helpText}</p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function FormTextarea({ label, error, optionalLabel, helpText, id, required, className, rows = 5, ...rest }, ref) {
  const inputId = id ?? rest.name;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-kron-dark"
      >
        {label}
        {!required && optionalLabel ? (
          <span className="ml-2 text-xs font-normal text-slate-400">
            ({optionalLabel})
          </span>
        ) : null}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        className={cls(Boolean(error))}
        required={required}
        {...rest}
      />
      {helpText ? (
        <p className="mt-1 text-xs text-slate-500">{helpText}</p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});

// Type export — downstream imports kolaylığı için.
export type { InputProps as FormFieldProps, TextareaProps as FormTextareaProps };
