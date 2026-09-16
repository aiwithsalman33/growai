// src/components/auth/AgencyLoginPage.tsx
import React, { useState } from 'react';
import { Briefcase, KeyRound } from 'lucide-react';
import { usePartner } from '../../lib/store';
import { AuthShell, AuthLink } from './AuthShell';
import { AuthError, PasswordField, SubmitButton, TextField } from './AuthFields';

export const AgencyLoginPage: React.FC = () => {
  const { login, navigate } = usePartner();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof fieldErrors = {};
    if (!email.trim()) next.email = 'Enter your work email address.';
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
    const res = await login('agency', email, password);
    setLoading(false);
    if (!res.success && res.error) setErrorMessage(res.error);
  };

  return (
    <AuthShell
      badge={{ icon: <Briefcase className="w-3.5 h-3.5" />, label: 'Agency partner' }}
      title="Sign in to your agency"
      subtitle="Switch between client locations, schedule in bulk, and manage your team"
      footer={
        <div className="flex flex-col gap-2.5">
          <div>
            Want to partner with us?{' '}
            <AuthLink onClick={() => navigate('/signup/agency')}>Create an agency account</AuthLink>
          </div>
          <div className="text-[11px]">
            Managing a single business?{' '}
            <AuthLink onClick={() => navigate('/login/user')}>Business sign in</AuthLink>
          </div>
        </div>
      }
    >
      {errorMessage && <AuthError message={errorMessage} onNavigate={navigate} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Work email address"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="you@youragency.com"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <PasswordField
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
          idleLabel="Sign in"
          busyLabel="Signing in..."
          icon={<KeyRound className="w-4 h-4" />}
        />
      </form>
    </AuthShell>
  );
};
