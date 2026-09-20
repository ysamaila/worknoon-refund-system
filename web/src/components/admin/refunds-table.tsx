'use client';

import React from 'react';
import { RefundRecord, ReviewStatus, getReviewStatus } from '@/lib/types';
import { ShieldAlert, Eye, Inbox, UserCheck, CheckCircle2 } from 'lucide-react';

export type ReviewFilter = 'ALL' | ReviewStatus;

interface RefundsTableProps {
  refunds: RefundRecord[];
  activeFilter: ReviewFilter;
  onFilterChange: (filter: ReviewFilter) => void;
  onSelectRefund: (refund: RefundRecord) => void;
  selectedRefundId?: string;
  isLoading?: boolean;
}

export function RefundsTable({
  refunds,
  activeFilter,
  onFilterChange,
  onSelectRefund,
  selectedRefundId,
  isLoading,
}: RefundsTableProps) {
  // Compute counts for tabs
  const needsAttentionCount = refunds.filter((r) => getReviewStatus(r) === 'NEEDS_ATTENTION').length;
  const attendedCount = refunds.filter((r) => getReviewStatus(r) === 'ATTENDED_BY_HUMAN').length;
  const autoResolvedCount = refunds.filter((r) => getReviewStatus(r) === 'AUTO_RESOLVED').length;

  const filterOptions: { label: string; value: ReviewFilter; count?: number }[] = [
    { label: 'All Issues', value: 'ALL', count: refunds.length },
    { label: 'Needs Attention', value: 'NEEDS_ATTENTION', count: needsAttentionCount },
    { label: 'Human Resolved', value: 'ATTENDED_BY_HUMAN', count: attendedCount },
    { label: 'Auto-Resolved', value: 'AUTO_RESOLVED', count: autoResolvedCount },
  ];

  // Filter list by review status
  const displayedRefunds = refunds.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return getReviewStatus(r) === activeFilter;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Filter Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>{opt.label}</span>
                {typeof opt.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      opt.value === 'NEEDS_ATTENTION' && opt.count > 0
                        ? 'bg-amber-100 text-amber-800 font-extrabold'
                        : isActive
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-300/60 text-slate-600'
                    }`}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {displayedRefunds.length} of {refunds.length} recorded claims
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      ) : displayedRefunds.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No issues matching this filter.</p>
          <p className="text-xs text-slate-400 mt-1">Select another tab to inspect other recorded claims.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Review State</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Extracted Reason</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-center">Security</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedRefunds.map((ref) => {
                const isSelected = ref.id === selectedRefundId;
                const status = getReviewStatus(ref);
                const formattedTime = new Date(ref.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                let pillColor = 'bg-slate-100 text-slate-700 border-slate-300';
                if (ref.decision === 'APPROVED') pillColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                if (ref.decision === 'DENIED') pillColor = 'bg-rose-50 text-rose-700 border-rose-300';
                if (ref.decision === 'ESCALATED') pillColor = 'bg-amber-50 text-amber-700 border-amber-300 font-bold';

                return (
                  <tr
                    key={ref.id}
                    onClick={() => onSelectRefund(ref)}
                    className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formattedTime}
                    </td>

                    {/* Review State Column */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {status === 'NEEDS_ATTENTION' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                          Needs Attention
                        </span>
                      ) : status === 'ATTENDED_BY_HUMAN' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                          Human Resolved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
                          Auto-Resolved
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{ref.customer?.name ?? 'Customer'}</div>
                      <div className="text-[11px] text-slate-500">{ref.customer?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {ref.order ? (
                        <div>
                          <span className="font-semibold text-indigo-600">{ref.order.orderNumber}</span>
                          <span className="text-slate-500 ml-1.5 font-bold">${Number(ref.order.totalAmount).toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None referenced</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {ref.claimedReason}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${pillColor}`}>
                        {ref.decision}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {ref.injectionFlag ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300 shadow-2xs">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          FLAGGED
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Clean</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRefund(ref);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
