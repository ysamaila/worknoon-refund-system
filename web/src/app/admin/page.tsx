'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefundRecord, getReviewStatus } from '@/lib/types';
import { listRefunds } from '@/lib/api';
import { RefundsTable, ReviewFilter } from '@/components/admin/refunds-table';
import { AuditDrawer } from '@/components/admin/audit-drawer';
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('ALL');
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await listRefunds({ limit: 100 });
      const items = res.items || [];
      setRefunds(items);
      // If a refund is selected, keep it synced without adding selectedRefund to deps
      setSelectedRefund((prev) => {
        if (!prev) return null;
        return items.find((r) => r.id === prev.id) || prev;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load refund requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleOverrideSuccess = (updated: RefundRecord) => {
    setSelectedRefund(updated);
    setRefunds((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Review Status metrics summary
  const totalCount = refunds.length;
  const needsAttentionCount = refunds.filter((r) => getReviewStatus(r) === 'NEEDS_ATTENTION').length;
  const attendedCount = refunds.filter((r) => getReviewStatus(r) === 'ATTENDED_BY_HUMAN').length;
  const autoResolvedCount = refunds.filter((r) => getReviewStatus(r) === 'AUTO_RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Support Operations Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time queue of customer refund claims, distinguishing issues needing human attention from resolved claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </Link>
          <button
            type="button"
            onClick={fetchRefunds}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveFilter('ALL')}
          className={`bg-white p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeFilter === 'ALL' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Claims</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('NEEDS_ATTENTION')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeFilter === 'NEEDS_ATTENTION'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40'
              : 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider flex items-center gap-1">
              {needsAttentionCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
              Needs Attention
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{needsAttentionCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('ATTENDED_BY_HUMAN')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeFilter === 'ATTENDED_BY_HUMAN'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40'
              : 'border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-indigo-800 uppercase tracking-wider">Human Resolved</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-1">{attendedCount}</p>
        </div>

        <div
          onClick={() => setActiveFilter('AUTO_RESOLVED')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeFilter === 'AUTO_RESOLVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
              : 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Auto-Resolved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{autoResolvedCount}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchRefunds}
            className="underline font-semibold hover:text-rose-900 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Refunds Table */}
      <RefundsTable
        refunds={refunds}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSelectRefund={setSelectedRefund}
        selectedRefundId={selectedRefund?.id}
        isLoading={isLoading}
      />

      {/* Audit & Context Slide-over Drawer */}
      <AuditDrawer
        refund={selectedRefund}
        onClose={() => setSelectedRefund(null)}
        onOverrideSuccess={handleOverrideSuccess}
      />
    </div>
  );
}
