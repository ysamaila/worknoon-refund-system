import { Decision } from '../../policy/types';
import { ReplyContext } from '../types';

export const TEMPLATED_REPLIES: Record<Decision, (ctx: ReplyContext) => string> = {
  APPROVED: (ctx) =>
    `Hello ${ctx.customerName}, your refund request for order ${ctx.orderNumber ?? 'reference'} has been approved in accordance with our return policy. A credit will be processed to your original payment method within 3-5 business days.`,
  DENIED: (ctx) =>
    `Hello ${ctx.customerName}, we have carefully reviewed your request for order ${ctx.orderNumber ?? 'reference'}. Unfortunately, we cannot authorize a refund at this time: ${ctx.decisionReason}. We apologize for any inconvenience.`,
  ESCALATED: (ctx) =>
    `Hello ${ctx.customerName}, your request for order ${ctx.orderNumber ?? 'reference'} requires additional review by our senior support specialists (${ctx.decisionReason}). A team member will follow up with you within 24 business hours.`,
};

/**
 * Defensive Layer 5: Output Consistency & Contradiction Validator
 * Checks whether an AI-drafted reply contradicts the deterministic verdict.
 */
export function validateReplyConsistency(
  draftReply: string,
  decision: Decision,
): { isValid: boolean; reason?: string } {
  const lower = draftReply.toLowerCase();

  if (decision === 'DENIED') {
    // A denied claim must never promise an approval or refund issuance
    const approvalSignals = [
      'has been approved',
      'have approved',
      'happy to approve',
      'refund has been authorized',
      'processed your refund',
      'will receive your refund in',
      'issuing a full refund',
    ];
    for (const signal of approvalSignals) {
      if (lower.includes(signal)) {
        return {
          isValid: false,
          reason: `Model drafted approval phrase ("${signal}") for a DENIED decision.`,
        };
      }
    }
  }

  if (decision === 'APPROVED') {
    // An approved claim must not state that it is denied
    const denialSignals = [
      'cannot authorize a refund',
      'unfortunately, we are unable to approve',
      'request has been denied',
      'not eligible for a refund',
    ];
    for (const signal of denialSignals) {
      if (lower.includes(signal)) {
        return {
          isValid: false,
          reason: `Model drafted denial phrase ("${signal}") for an APPROVED decision.`,
        };
      }
    }
  }

  return { isValid: true };
}

function sanitizeReply(text: string): string {
  return text.replace(/--/g, ' - ').replace(/—/g, ' - ');
}

/**
 * Resolves the final customer reply.
 * If the model draft is consistent, returns it; otherwise returns the secure deterministic template.
 */
export function resolveCustomerReply(
  draftReply: string | null | undefined,
  ctx: ReplyContext,
): { reply: string; usedFallback: boolean; fallbackReason?: string } {
  if (!draftReply || typeof draftReply !== 'string' || draftReply.trim().length === 0) {
    return {
      reply: sanitizeReply(TEMPLATED_REPLIES[ctx.decision](ctx)),
      usedFallback: true,
      fallbackReason: 'AI driver returned empty or null draft.',
    };
  }

  const check = validateReplyConsistency(draftReply, ctx.decision);
  if (!check.isValid) {
    return {
      reply: sanitizeReply(TEMPLATED_REPLIES[ctx.decision](ctx)),
      usedFallback: true,
      fallbackReason: check.reason,
    };
  }

  return {
    reply: sanitizeReply(draftReply.trim()),
    usedFallback: false,
  };
}
