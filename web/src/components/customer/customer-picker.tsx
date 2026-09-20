'use client';

import React from 'react';
import { Customer } from '@/lib/types';
import { User, ShieldAlert, Award } from 'lucide-react';

interface CustomerPickerProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelect: (customer: Customer) => void;
  isLoading?: boolean;
}

export function CustomerPicker({
  customers,
  selectedCustomerId,
  onSelect,
  isLoading,
}: CustomerPickerProps) {
  const selected = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <label htmlFor="customer-select" className="block text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <User className="w-4 h-4 text-indigo-600" />
          Active Customer Profile (Demo Session)
        </label>
        {selected?.tier === 'PREMIUM' && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Award className="w-3 h-3 text-amber-600" />
            VIP Premium Tier
          </span>
        )}
      </div>

      <select
        id="customer-select"
        value={selectedCustomerId}
        onChange={(e) => {
          const found = customers.find((c) => c.id === e.target.value);
          if (found) onSelect(found);
        }}
        disabled={isLoading || customers.length === 0}
        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
      >
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.email}) {c.tier === 'PREMIUM' ? '[VIP]' : ''} {c.riskFlag ? '[Flagged]' : ''}
          </option>
        ))}
      </select>

      {selected && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Customer ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{selected.id.slice(0, 8)}...</code>
            </span>
            <span>
              Account Tier: <strong className="text-slate-800">{selected.tier}</strong>
            </span>
          </div>

          {selected.riskFlag && (
            <div className="flex items-center gap-1 text-rose-600 font-semibold mt-1 sm:mt-0">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Prior Refund Abuse Signal (Auto-Escalates)</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
