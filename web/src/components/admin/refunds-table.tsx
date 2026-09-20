'use client';

import React from 'react';
import { Decision, RefundRecord } from '@/lib/types';
import { ShieldAlert, Eye, Inbox } from 'lucide-react';

interface RefundsTableProps {
  refunds: RefundRecord[];
  activeFilter?: Decision;
  onFilterChange: (decision?: Decision) => void;
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
  const filterOptions: { label: string; value?: Decision }[] = [
    { label: 'All Requests' },
    { label: 'Escalated (Action Req)', value: 'ESCALATED' },
    { label: 'Denied', value: 'DENIED' },
    { label: 'Approved', value: 'APPROVED' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header Filter Tabs */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
          {filterOptions.map((opt, idx) => {
            const isActive = activeFilter === opt.value;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onFilterChange(opt.value)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {refunds.length} recorded claims
        </span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center animate-pulse space-y-3">
          <div className="h-6 bg-slate-200 rounded w-1/4 mx-auto"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      ) : refunds.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No refund claims matching this filter.</p>
          <p className="text-xs text-slate-400 mt-1">Submit claims from the customer portal to populate this log.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Extracted Reason</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4 text-center">Security</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {refunds.map((ref) => {
                const isSelected = ref.id === selectedRefundId;
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
