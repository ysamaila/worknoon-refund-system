'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Decision, RefundRecord } from '@/lib/types';
import { listRefunds } from '@/lib/api';
import { RefundsTable } from '@/components/admin/refunds-table';
import { AuditDrawer } from '@/components/admin/audit-drawer';
import {
  Shield,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<Decision | undefined>(undefined);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await listRefunds({ decision: activeFilter, limit: 100 });
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
  }, [activeFilter]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleOverrideSuccess = (updated: RefundRecord) => {
    setSelectedRefund(updated);
    setRefunds((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  // Metrics summary
  const totalCount = refunds.length;
  const escalatedCount = refunds.filter((r) => r.decision === 'ESCALATED').length;
  const approvedCount = refunds.filter((r) => r.decision === 'APPROVED').length;
  const deniedCount = refunds.filter((r) => r.decision === 'DENIED').length;

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
            Real-time audit log of customer refund requests, deterministic rule traces, and human supervisor escalation controls.
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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Claims</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">Escalated (Action Req)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{escalatedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Approved</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">Denied</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1">{deniedCount}</p>
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
