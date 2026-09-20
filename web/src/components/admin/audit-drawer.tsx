'use client';

import React, { useState } from 'react';
import { RefundRecord, getReviewStatus, getHumanOverrideDetails } from '@/lib/types';
import { overrideRefund } from '@/lib/api';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  FileText,
  User,
  UserCheck,
  Package,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface AuditDrawerProps {
  refund: RefundRecord | null;
  onClose: () => void;
  onOverrideSuccess: (updated: RefundRecord) => void;
}

export function AuditDrawer({ refund, onClose, onOverrideSuccess }: AuditDrawerProps) {
  const [overrideDecision, setOverrideDecision] = useState<'APPROVED' | 'DENIED'>('APPROVED');
  const [overrideReason, setOverrideReason] = useState('');
  const [operatorName, setOperatorName] = useState('Admin Operator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!refund) return null;

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setSubmitError('An override justification reason is mandatory.');
      return;
    }
    if (overrideReason.trim().length < 10) {
      setSubmitError('Reason must be at least 10 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const updated = await overrideRefund(refund.id, {
        decision: overrideDecision,
        overrideReason: overrideReason.trim(),
        operatorName: operatorName.trim() || 'Admin Operator',
      });
      onOverrideSuccess(updated);
      setOverrideReason('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEscalated = refund.decision === 'ESCALATED';
  const status = getReviewStatus(refund);
  const humanOverride = getHumanOverrideDetails(refund);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500 font-bold uppercase">
                Claim Audit #{refund.id.slice(-8)}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  refund.decision === 'APPROVED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : refund.decision === 'DENIED'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {refund.decision}
              </span>
              {refund.injectionFlag && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  PROMPT INJECTION
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-1">
              {refund.customer?.name} &bull; {refund.order ? `Order ${refund.order.orderNumber}` : 'No Order Referenced'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Attention / Review State Banner */}
          {status === 'NEEDS_ATTENTION' ? (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <div>
                  <p className="font-bold">Awaiting Human Supervisor Action</p>
                  <p className="text-amber-700 text-[11px]">This claim requires review and a final authorization decision.</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 border border-amber-300 shrink-0">
                Unattended
              </span>
            </div>
          ) : status === 'ATTENDED_BY_HUMAN' ? (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="font-bold">Attended &amp; Resolved by Human Operator</p>
                  <p className="text-indigo-700 text-[11px]">{humanOverride?.detail}</p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">
                Attended
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <p className="font-semibold">Auto-Resolved by Policy Engine</p>
                  <p className="text-slate-500 text-[11px]">Evaluated and finalized automatically against authoritative rules.</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0">
                Automated
              </span>
            </div>
          )}

          {/* Section: Customer & Ground Truth Context */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wide">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Customer Facts
              </div>
              <p className="text-slate-900 font-semibold">{refund.customer?.name}</p>
              <p className="text-slate-500">{refund.customer?.email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                  {refund.customer?.tier} TIER
                </span>
                {refund.customer?.riskFlag ? (
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                    Risk Flagged
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">
                    Standard Risk
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wide">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Order Ground Truth
              </div>
              {refund.order ? (
                <>
                  <p className="text-slate-900 font-semibold">
                    {refund.order.orderNumber}{' '}
                    <span className="text-slate-500 font-normal">
                      (${Number(refund.order.totalAmount).toFixed(2)})
                    </span>
                  </p>
                  <p className="text-slate-500">Status: <span className="font-semibold text-slate-700">{refund.order.status}</span></p>
                  <div className="flex items-center gap-2 pt-1">
                    {refund.order.isFinalSale && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                        Final Sale
                      </span>
                    )}
                    {refund.order.deliveredAt ? (
                      <span className="text-slate-500 text-[10px]">
                        Delivered: {new Date(refund.order.deliveredAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">Not delivered</span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic pt-2">No matching order identified in DB.</p>
              )}
            </div>
          </div>

          {/* Section: Raw Customer Prompt */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Raw Customer Inquiry
            </div>
            <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
              {refund.rawMessage}
            </div>
          </div>

          {/* Section: AI Extraction & Telemetry */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                AI Extraction & Telemetry
              </div>
              {refund.aiTrace?.extraction?.telemetry && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded">
                    {refund.aiTrace.extraction.telemetry.driver}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {refund.aiTrace.extraction.telemetry.latencyMs}ms
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Classified Reason</span>
                <span className="font-semibold text-slate-800">{refund.claimedReason}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Confidence</span>
                <span className="font-semibold text-indigo-600">
                  {refund.aiTrace?.extraction?.confidence
                    ? `${(refund.aiTrace.extraction.confidence * 100).toFixed(0)}%`
                    : 'Deterministic'}
                </span>
              </div>
            </div>

            {/* Injection Security Banner */}
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                refund.injectionFlag
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {refund.injectionFlag ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>
                  {refund.injectionFlag
                    ? 'Security alert: Adversarial prompt injection detected.'
                    : 'Security check: Customer text validated clean.'}
                </span>
              </div>
              {refund.aiTrace?.injectionCheck?.matchedPatterns &&
                refund.aiTrace.injectionCheck.matchedPatterns.length > 0 && (
                  <span className="font-mono text-[10px] bg-rose-200/70 text-rose-900 px-2 py-0.5 rounded">
                    {refund.aiTrace.injectionCheck.matchedPatterns.join(', ')}
                  </span>
                )}
            </div>
          </div>

          {/* Section: Deterministic Policy Engine Evaluation Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                Deterministic Policy Trace (RP-001 &ndash; RP-009)
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Precedence: DENY &gt; ESCALATE &gt; APPROVE</span>
            </div>

            <div className="space-y-1.5">
              {refund.policyTrace?.map((verdict) => {
                const isPass = verdict.outcome === 'PASS';
                const isDeny = verdict.outcome === 'DENY';
                const isEscalate = verdict.outcome === 'ESCALATE';

                return (
                  <div
                    key={verdict.ruleId}
                    className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-3 ${
                      isDeny
                        ? 'bg-rose-50/70 border-rose-200'
                        : isEscalate
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 text-[11px]">{verdict.ruleId}</span>
                        <span className="font-semibold text-slate-700">{verdict.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{verdict.detail}</p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 border ${
                        isPass
                          ? 'bg-slate-100 text-slate-500 border-slate-300'
                          : isDeny
                          ? 'bg-rose-100 text-rose-700 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {verdict.outcome}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Customer Response Sent */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Customer Reply (Generated / Sent)
            </div>
            <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs text-slate-700 leading-relaxed italic">
              &ldquo;{refund.customerReply}&rdquo;
            </div>
          </div>

          {/* Section: Human Operator Override Controls */}
          <div className="pt-2">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-lg border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-sm">Human Operator Override</h4>
                </div>
                {isEscalated && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Supervisors can manually review and finalize claims. An override action records an immutable{' '}
                <span className="font-mono text-indigo-300">HUMAN-OVERRIDE</span> audit entry.
              </p>

              <form onSubmit={handleOverrideSubmit} className="space-y-3.5">
                {submitError && (
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('APPROVED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      overrideDecision === 'APPROVED'
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Authorize Approval
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideDecision('DENIED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      overrideDecision === 'DENIED'
                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Enforce Denial
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Operator</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Override Reason <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified photo of defective product with vendor"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        Recording Override...
                      </>
                    ) : (
                      <>
                        <span>Submit Decision Override</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
