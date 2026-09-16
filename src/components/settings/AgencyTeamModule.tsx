// src/components/settings/AgencyTeamModule.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { Users, UserPlus, Shield, Trash2, Mail, CheckCircle2 } from 'lucide-react';

export const AgencyTeamModule: React.FC = () => {
  const { teamMembers, inviteTeamMember, removeTeamMember, addToast } = usePartner();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'contributor'>('manager');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setIsInviting(true);
    await inviteTeamMember(name, email, role);
    setName('');
    setEmail('');
    setIsInviting(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink">Agency Team & Access Permissions</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-800 bg-brand-100 px-2.5 py-0.5 rounded-full border border-brand-200">
                {teamMembers.length} Members Active
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Invite account managers, review responders, and content designers to manage client GBP locations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invite Form */}
        <div className="bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand-600" />
            Invite Teammate
          </h4>

          <form onSubmit={handleInvite} className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Jenkins"
                required
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@agency.com"
                required
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 bg-surface border border-surface-border rounded-xl text-ink font-medium"
              >
                <option value="manager">Account Manager (Publish & Reply)</option>
                <option value="admin">Agency Admin (Full Billing & Client Access)</option>
                <option value="contributor">Contributor (Draft Only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs transition-colors mt-2"
            >
              {isInviting ? 'Sending Invite...' : 'Send Team Invitation'}
            </button>
          </form>
        </div>

        {/* Member List */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-600" />
            Current Agency Staff ({teamMembers.length})
          </h4>

          <div className="divide-y divide-surface-border">
            {teamMembers.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{member.name}</p>
                    <p className="text-[11px] text-ink-muted truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-brand-800 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {member.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeTeamMember(member.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
