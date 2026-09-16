// src/components/auth/AuthFields.tsx
//
// Form primitives shared by the login and signup screens: consistent styling,
// real validation state, and the autoComplete hints password managers need.
import React, { useId, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, X } from 'lucide-react';
import type { AuthTone } from './AuthShell';

const inputClass = (tone: AuthTone, invalid: boolean) =>
  [
    'w-full px-3.5 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2',
    tone === 'dark'
      ? 'bg-gray-950 border text-white placeholder:text-gray-600'
      : 'bg-surface border text-ink placeholder:text-ink-muted/60',
    invalid
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : tone === 'dark'
        ? 'border-gray-800 focus:ring-brand-500/30 focus:border-brand-500'
        : 'border-surface-border focus:ring-brand-500/20 focus:border-brand-500',
  ].join(' ');

const labelClass = (tone: AuthTone) =>
  `block text-xs font-semibold mb-1.5 ${tone === 'dark' ? 'text-gray-300' : 'text-ink'}`;

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string | null;
  tone?: AuthTone;
  hint?: string;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  required = true,
  error,
  tone = 'light',
  hint,
}: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass(tone)}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass(tone, Boolean(error))}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className={`mt-1 text-[11px] ${tone === 'dark' ? 'text-gray-500' : 'text-ink-muted'}`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};

interface PasswordFieldProps extends Omit<FieldProps, 'type'> {
  /** Renders the live requirement checklist used on the signup screens. */
  showRequirements?: boolean;
}

export const PASSWORD_MIN = 8;

export const passwordChecks = (value: string) => [
  { label: `At least ${PASSWORD_MIN} characters`, met: value.length >= PASSWORD_MIN },
  { label: 'One letter', met: /[a-zA-Z]/.test(value) },
  { label: 'One number', met: /[0-9]/.test(value) },
];

export function PasswordField({
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = true,
  error,
  tone = 'light',
  hint,
  showRequirements = false,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const checks = passwordChecks(value);

  return (
    <div>
      <label htmlFor={id} className={labelClass(tone)}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClass(tone, Boolean(error))} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className={`absolute inset-y-0 right-0 px-3 flex items-center rounded-r-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
            tone === 'dark'
              ? 'text-gray-500 hover:text-gray-300'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className={`mt-1 text-[11px] ${tone === 'dark' ? 'text-gray-500' : 'text-ink-muted'}`}>
          {hint}
        </p>
      )}

      {showRequirements && value.length > 0 && (
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
          {checks.map((check) => (
            <li
              key={check.label}
              className={`flex items-center gap-1 text-[11px] ${
                check.met
                  ? 'text-brand-700'
                  : tone === 'dark'
                    ? 'text-gray-500'
                    : 'text-ink-muted'
              }`}
            >
              {check.met ? (
                <Check className="w-3 h-3 shrink-0" />
              ) : (
                <X className="w-3 h-3 shrink-0 opacity-50" />
              )}
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * Error banner. The server answers a wrong-portal login with the correct path
 * ("This account signs in through /login/agency."), so the path is parsed out
 * and offered as a button rather than leaving the user to read a URL.
 */
export function AuthError({
  message,
  tone = 'light',
  onNavigate,
}: {
  message: string;
  tone?: AuthTone;
  onNavigate: (path: string) => void;
}) {
  const match = message.match(/\/login\/(user|agency|admin)/);
  const target = match?.[0];
  const portalName =
    match?.[1] === 'agency'
      ? 'Agency Portal'
      : match?.[1] === 'admin'
        ? 'Super Admin Portal'
        : 'Business Portal';

  return (
    <div
      role="alert"
      className={`mb-5 p-3.5 rounded-xl text-xs flex flex-col gap-2 ${
        tone === 'dark'
          ? 'bg-red-950/40 border border-red-900 text-red-300'
          : 'bg-red-50 border border-red-200 text-red-700'
      }`}
    >
      <div className="flex items-start gap-2">
        <AlertCircle
          className={`w-4 h-4 shrink-0 mt-0.5 ${tone === 'dark' ? 'text-red-400' : 'text-red-600'}`}
        />
        <span className="leading-relaxed font-medium">{message}</span>
      </div>

      {target && (
        <button
          type="button"
          onClick={() => onNavigate(target)}
          className={`self-start inline-flex items-center gap-1 text-[11px] font-bold rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
            tone === 'dark' ? 'text-brand-400' : 'text-brand-700'
          }`}
        >
          <span>Go to the {portalName}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export const SubmitButton: React.FC<{
  loading: boolean;
  idleLabel: string;
  busyLabel: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ loading, idleLabel, busyLabel, icon, disabled }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="w-full mt-1 py-3 px-4 rounded-xl text-sm font-semibold bg-brand-500 hover:bg-brand-600 text-white transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    <span>{loading ? busyLabel : idleLabel}</span>
  </button>
);
