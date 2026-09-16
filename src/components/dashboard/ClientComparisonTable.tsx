// src/components/dashboard/ClientComparisonTable.tsx
import React, { useState } from 'react';
import { usePartner } from '../../lib/store';
import { GbpAccount } from '../../types';
import {
  Building2,
  Star,
  ExternalLink,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Search
} from 'lucide-react';

export const ClientComparisonTable: React.FC = () => {
  const { userGbpAccounts, activeGbpAccountId, setActiveGbpAccountId, navigate, reviews, posts } =
    usePartner();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'rating' | 'reviews' | 'health'>('rating');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = userGbpAccounts
    .filter((client) => {
      const q = searchTerm.toLowerCase();
      return (
        client.clientLabel?.toLowerCase().includes(q) ||
        client.locationName.toLowerCase().includes(q) ||
        client.category?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'rating') {
        valA = a.rating || 0;
        valB = b.rating || 0;
      } else if (sortField === 'reviews') {
        valA = a.reviewsCount || 0;
        valB = b.reviewsCount || 0;
      } else if (sortField === 'health') {
        valA = a.healthScore || 0;
        valB = b.healthScore || 0;
      }
      return sortAsc ? valA - valB : valB - valA;
    });

  const handleSort = (field: 'rating' | 'reviews' | 'health') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-surface-border p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-ink">Client Performance Comparison</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-brand-100 text-brand-800 rounded-full">
              {userGbpAccounts.length} Connected Accounts
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Benchmark rating, review volume, and profile health scores across all agency clients
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-surface-muted border border-surface-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-ink-muted font-semibold uppercase tracking-wider">
              <th className="pb-3 px-3">Client Profile</th>
              <th className="pb-3 px-3">Category</th>
              <th
                className="pb-3 px-3 cursor-pointer hover:text-ink"
                onClick={() => handleSort('rating')}
              >
                <div className="flex items-center gap-1">
                  <span>Rating</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="pb-3 px-3 cursor-pointer hover:text-ink"
                onClick={() => handleSort('reviews')}
              >
                <div className="flex items-center gap-1">
                  <span>Total Reviews</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="pb-3 px-3 cursor-pointer hover:text-ink"
                onClick={() => handleSort('health')}
              >
                <div className="flex items-center gap-1">
                  <span>Profile Health</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="pb-3 px-3">Pending Action</th>
              <th className="pb-3 px-3 text-right">Switch Scope</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((client) => {
              const isActive = client.id === activeGbpAccountId;
              const unrepliedCount = reviews.filter(
                (r) => r.gbpAccountId === client.id && !r.replyText
              ).length;
              const postCount = posts.filter((p) => p.gbpAccountId === client.id).length;

              return (
                <tr
                  key={client.id}
                  className={`hover:bg-brand-50/40 transition-colors ${
                    isActive ? 'bg-brand-50/50 font-medium' : ''
                  }`}
                >
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {client.clientLabel?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-ink">
                          {client.clientLabel || client.locationName}
                        </p>
                        <p className="text-[10px] text-ink-muted truncate max-w-[200px]">
                          {client.address}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-ink-muted">{client.category || 'Business'}</td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1 font-bold text-ink">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{client.rating?.toFixed(1) || '4.8'}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-ink">{client.reviewsCount || 150}</span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full"
                          style={{ width: `${client.healthScore || 85}%` }}
                        />
                      </div>
                      <span className="text-ink font-semibold">{client.healthScore || 85}%</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    {unrepliedCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        {unrepliedCount} Review{unrepliedCount > 1 ? 's' : ''} to reply
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> All replied
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGbpAccountId(client.id);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'bg-surface-muted hover:bg-brand-50 text-ink border border-surface-border'
                      }`}
                    >
                      {isActive ? 'Active Client' : 'Manage Client'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
