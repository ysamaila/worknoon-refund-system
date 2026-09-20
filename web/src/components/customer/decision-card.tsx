'use client';

import React, { useState } from 'react';
import { RefundRecord } from '@/lib/types';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Bot, ShieldCheck, ShieldAlert } from 'lucide-react';

interface DecisionCardProps {
  refund: RefundRecord;
}

export function DecisionCard({ refund }: DecisionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isApproved = refund.decision === 'APPROVED';
  const isDenied = refund.decision === 'DENIED';
  const isEscalated = refund.decision === 'ESCALATED';

  let badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  let headerBg = 'bg-amber-50/50 border-amber-200';
  let Icon = AlertTriangle;

  if (isApproved) {
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    headerBg = 'bg-emerald-50/50 border-emerald-200';
    Icon = CheckCircle2;
  } else if (isDenied) {
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
    headerBg = 'bg-rose-50/50 border-rose-200';
    Icon = XCircle;
  }

  return (
    <div className={`rounded-xl border overflow-hidden shadow-sm transition-all ${headerBg}`}>
      {/* Header Verdict Bar */}
      <div className="p-5 border-b border-inherit flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white rounded-lg shadow-2xs border border-inherit">
            <Icon className={`w-5 h-5 ${isApproved ? 'text-emerald-600' : isDenied ? 'text-rose-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Official Outcome</span>
            <span className={`inline-flex items-center text-xs font-extrabold px-3 py-1 rounded-full border ${badgeColor}`}>
              {refund.decision}
            </span>
          </div>
        </div>

        {refund.injectionFlag && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Adversarial Prompt Injection Detected</span>
          </div>
        )}
      </div>

      {/* AI Explanation Message */}
      <div className="p-5 bg-white space-y-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            Support Specialist Reply (AI Drafted, Policy Constrained):
          </span>
          <p className="text-sm text-slate-800 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            {refund.customerReply}
          </p>
        </div>

        {/* Collapsible Rule Trace Accordion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors border border-slate-200"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Why this decision? (Inspect Deterministic Rule Trace)
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-3 space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-72 overflow-y-auto">
              <div className="text-[11px] text-slate-500 font-semibold mb-2">
                Evaluated against published policies in <code className="text-indigo-600">docs/refund-policy.md</code>:
              </div>

              {refund.policyTrace.map((rule, idx) => {
                let rulePill = 'bg-slate-200 text-slate-700';
                if (rule.outcome === 'PASS') rulePill = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                if (rule.outcome === 'DENY') rulePill = 'bg-rose-100 text-rose-800 border-rose-300';
                if (rule.outcome === 'ESCALATE') rulePill = 'bg-amber-100 text-amber-800 border-amber-300';

                return (
                  <div key={idx} className="p-2.5 rounded bg-white border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{rule.ruleId}: {rule.title}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${rulePill}`}>
                        {rule.outcome}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{rule.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
