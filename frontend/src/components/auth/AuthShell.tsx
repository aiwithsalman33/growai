// src/components/auth/AuthShell.tsx
//
// Shared chrome for every auth screen. The five pages were near-identical
// copies drifting apart from each other; they now differ only in their fields.
import React from 'react';
import { Sparkles } from 'lucide-react';
import { usePartner } from '../../lib/store';

export type AuthTone = 'light' | 'dark';

interface AuthShellProps {
  tone?: AuthTone;
  badge: { icon: React.ReactNode; label: string };
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({
  tone = 'light',
  badge,
  title,
  subtitle,
  children,
  footer,
}) => {
  const { navigate } = usePartner();
  const dark = tone === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col justify-center py-10 sm:py-12 px-4 sm:px-6 lg:px-8 ${
        dark ? 'bg-gray-950' : 'bg-surface-muted'
      }`}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 mb-5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <span className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </span>
          <span
            className={`text-2xl font-black tracking-tight ${dark ? 'text-white' : 'text-ink'}`}
          >
            Partner<span className="text-brand-500">.ai</span>
          </span>
        </button>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
            dark
              ? 'bg-gray-900 border border-gray-800 text-gray-300'
              : 'bg-brand-50 border border-brand-200 text-brand-700'
          }`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </div>

        <h1
          className={`text-2xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}
        >
          {title}
        </h1>
        <p className={`mt-1.5 text-xs ${dark ? 'text-gray-400' : 'text-ink-muted'}`}>
          {subtitle}
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className={`py-7 px-5 sm:px-8 rounded-2xl ${
            dark
              ? 'bg-gray-900 border border-gray-800 shadow-xl'
              : 'bg-surface border border-surface-border shadow-sm'
          }`}
        >
          {children}

          {footer && (
            <div
              className={`mt-6 pt-5 border-t text-center text-xs ${
                dark ? 'border-gray-800 text-gray-500' : 'border-surface-border text-ink-muted'
              }`}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/** Inline text button used throughout the auth footers. */
export const AuthLink: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  tone?: AuthTone;
}> = ({ onClick, children, tone = 'light' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`font-bold rounded hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
      tone === 'dark' ? 'text-brand-400' : 'text-brand-600'
    }`}
  >
    {children}
  </button>
);
