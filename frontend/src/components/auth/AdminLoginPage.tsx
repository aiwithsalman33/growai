// src/components/auth/AdminLoginPage.tsx
//
// Dark tone to make it visually obvious this is the internal operator portal
// rather than a tenant one.
import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Terminal } from 'lucide-react';
import { usePartner } from '../../lib/store';
import { AuthShell } from './AuthShell';
import { AuthError, PasswordField, SubmitButton, TextField } from './AuthFields';

export const AdminLoginPage: React.FC = () => {
  const { login, navigate } = usePartner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = 'Enter your admin email address.';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'That does not look like an email address.';
    if (!password) next.password = 'Enter your password.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!validate()) return;

    setLoading(true);
    const res = await login('super_admin', email, password);
    setLoading(false);
    if (!res.success && res.error) setErrorMessage(res.error);
  };

  return (
    <AuthShell
      tone="dark"
      badge={{ icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Internal — operators only' }}
      title="Super admin access"
      subtitle="Platform operations: users, agencies, pricing, and global settings"
      footer={
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-center gap-1.5 text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-gray-400" />
            <span>Actions in this portal are recorded in the audit log.</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors text-[11px] rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            ← Return to the public site
          </button>
        </div>
      }
    >
      {errorMessage && (
        <AuthError message={errorMessage} tone="dark" onNavigate={navigate} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          tone="dark"
          label="Admin email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="admin@partner.ai"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <PasswordField
          tone="dark"
          label="Password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          autoComplete="current-password"
          error={fieldErrors.password}
        />

        <SubmitButton
          loading={loading}
          idleLabel="Authenticate"
          busyLabel="Verifying..."
          icon={<KeyRound className="w-4 h-4" />}
        />
      </form>
    </AuthShell>
  );
};
