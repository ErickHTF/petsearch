// Labeled form controls: every input has a label, hint and error wired via aria (NFR-03).
import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined
  );
}

function FieldShell({
  id,
  label,
  hint,
  error,
  optional,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1 block font-semibold text-ink">
        {label}
        {optional ? <span className="font-normal text-muted"> (opcional)</span> : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mb-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

export function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-danger">
      {error}
    </p>
  );
}

export function TextField({
  label,
  hint,
  error,
  optional,
  ref,
  id: givenId,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <input
        ref={ref}
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  ref,
  id: givenId,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        ref={ref}
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  ref,
  id: givenId,
  options,
  placeholder,
  ...props
}: FieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    ref?: Ref<HTMLSelectElement>;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <select
        ref={ref}
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...props}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  error,
  ref,
  id: givenId,
  ...props
}: { label: ReactNode; error?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    ref?: Ref<HTMLInputElement>;
  }) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <div className="mb-4">
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="mt-3 h-5 w-5 shrink-0 accent-primary"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        <label htmlFor={id} className="flex min-h-11 items-center">
          <span>{label}</span>
        </label>
      </div>
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Group of radios or checkboxes under one legend. */
export function ChoiceGroup({
  legend,
  error,
  hint,
  children,
}: {
  legend: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset
      className="mb-4 border-0 p-0"
      aria-describedby={describedBy(id, hint, error)}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-1 font-semibold text-ink">{legend}</legend>
      {hint ? (
        <p id={`${id}-hint`} className="mb-1 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-x-5">{children}</div>
      <FieldError id={id} error={error} />
    </fieldset>
  );
}

export function Choice({
  label,
  ref,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return (
    <label className="choice">
      <input ref={ref} {...props} />
      <span>{label}</span>
    </label>
  );
}
