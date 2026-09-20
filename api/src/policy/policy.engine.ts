import { PolicyInput, PolicyResult, RuleVerdict } from './types';
import { RULES } from './rules';

/**
 * Pure, deterministic evaluation of a customer refund request.
 *
 * Enforces strict precedence hierarchy:
 * 1. DENY: Any rule returning DENY immediately rejects the request.
 * 2. ESCALATE: If no DENY exists, any rule returning ESCALATE routes to a human agent.
 * 3. APPROVED: If and only if all evaluated rules return PASS, the refund is authorized.
 *
 * Resolution Order Rationale:
 * Deny-over-escalate prevents abusive or permanently ineligible claims (e.g. past 90 days)
 * from consuming human agent queue capacity.
 *
 * Zero external dependencies: no network, no LLM, no database calls.
 */
export function evaluate(input: PolicyInput): PolicyResult {
  const trace: RuleVerdict[] = [];

  for (const rule of RULES) {
    const verdict = rule.evaluate(input);
    trace.push(verdict);
  }

  // 1. Check for any DENY
  const denyVerdict = trace.find((v) => v.outcome === 'DENY');
  if (denyVerdict) {
    return {
      decision: 'DENIED',
      reason: denyVerdict.detail,
      trace,
    };
  }

  // 2. Check for any ESCALATE
  const escalateVerdict = trace.find((v) => v.outcome === 'ESCALATE');
  if (escalateVerdict) {
    return {
      decision: 'ESCALATED',
      reason: escalateVerdict.detail,
      trace,
    };
  }

  // 3. All passed -> APPROVED
  return {
    decision: 'APPROVED',
    reason: 'Approved: Request satisfies all standard refund eligibility criteria.',
    trace,
  };
}
