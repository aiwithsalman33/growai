// src/components/auth/UserSignupPage.tsx
import React, { useState } from 'react';
import { Building2, ArrowRight, Check } from 'lucide-react';
import { usePartner } from '../../lib/store';
import { AuthShell, AuthLink } from './AuthShell';
import {
  AuthError,
  PASSWORD_MIN,
  PasswordField,
  SubmitButton,
  TextField,
  passwordChecks,
} from './AuthFields';

export const UserSignupPage: React.FC = () => {
  const { signup, navigate, pricingPlans } = usePartner();

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  // The plan a new single-business signup lands on — read from the API rather
  // than hardcoded, so the pricing shown here cannot drift from the real plan.
  const plan = pricingPlans.filter((p) => !p.isAgencyPlan).sort((a, b) => a.priceMonthly - b.priceMonthly)[0];

  const validate = () => {
    const next: Record<string, string | undefined> = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!businessName.trim()) next.businessName = 'Enter your business name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (passwordChecks(password).some((c) => !c.met)) {
      next.password = `Use at least ${PASSWORD_MIN} characters, with a letter and a number.`;
    }
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setFieldErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    const res = await signup('single', name, email, businessName, password);
    setLoading(false);
    if (res && !res.success && res.error) setError(res.error);
  };

  const clear = (key: string) => setFieldErrors((f) => ({ ...f, [key]: undefined }));

  return (
    <AuthShell
      badge={{ icon: <Building2 className="w-3.5 h-3.5" />, label: 'Business account' }}
      title="Create your business account"
      subtitle="Connect your Google Business Profile and start replying with AI"
      footer={
        <div>
          Already have an account?{' '}
          <AuthLink onClick={() => navigate('/login/user')}>Sign in</AuthLink>
        </div>
      }
    >
      {error && <AuthError message={error} onNavigate={navigate} />}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <TextField
          label="Your full name"
          value={name}
          onChange={(v) => {
            setName(v);
            clear('name');
          }}
          placeholder="Alex Morgan"
          autoComplete="name"
          error={fieldErrors.name}
        />

        <TextField
          label="Business name"
          value={businessName}
          onChange={(v) => {
            setBusinessName(v);
            clear('businessName');
          }}
          placeholder="Artisan Roast & Espresso"
          autoComplete="organization"
          error={fieldErrors.businessName}
        />

        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clear('email');
          }}
          placeholder="you@yourbusiness.com"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <PasswordField
          label="Password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            clear('password');
          }}
          placeholder={`At least ${PASSWORD_MIN} characters`}
          autoComplete="new-password"
          error={fieldErrors.password}
          showRequirements
        />

        <PasswordField
          label="Confirm password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            clear('confirm');
          }}
          placeholder="Re-enter your password"
          autoComplete="new-password"
          error={fieldErrors.confirm}
        />

        {plan && (
          <div className="p-3.5 bg-surface-muted rounded-xl border border-surface-border">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-xs font-bold text-ink">{plan.name}</span>
              <span className="text-xs font-bold text-brand-700">
                ${plan.priceMonthly}
                <span className="font-medium text-ink-muted">/mo</span>
              </span>
            </div>
            <ul className="space-y-1">
              {plan.features.slice(0, 3).map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-[11px] text-ink-muted">
                  <Check className="w-3 h-3 mt-0.5 shrink-0 text-brand-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <SubmitButton
          loading={loading}
          idleLabel="Create account"
          busyLabel="Creating account..."
          icon={<ArrowRight className="w-4 h-4" />}
        />
      </form>
    </AuthShell>
  );
};
