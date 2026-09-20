import { PolicyInput, RuleVerdict } from './types';

export const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;

export function getDeliveryDays(now: Date, deliveredAt: Date | null): number | null {
  if (!deliveredAt) return null;
  const diffTime = now.getTime() - deliveredAt.getTime();
  return diffTime / MILLISECONDS_IN_A_DAY;
}

export type PolicyRule = {
  id: string;
  title: string;
  evaluate: (input: PolicyInput) => RuleVerdict;
};

export const RULES: PolicyRule[] = [
  // RP-007: Account Ownership Verification
  {
    id: 'RP-007',
    title: 'Account Ownership Verification',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (!input.order || input.order.customerId !== input.customer.id) {
        return {
          ruleId: 'RP-007',
          title: 'Account Ownership Verification',
          outcome: 'DENY',
          detail: 'Denied under RP-007: Order does not belong to the requesting customer account.',
        };
      }
      return {
        ruleId: 'RP-007',
        title: 'Account Ownership Verification',
        outcome: 'PASS',
        detail: 'Passed RP-007: Order ownership verified.',
      };
    },
  },

  // RP-005: Order Delivery Status Validation
  {
    id: 'RP-005',
    title: 'Order Delivery Status Validation',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (!input.order) {
        return {
          ruleId: 'RP-005',
          title: 'Order Delivery Status Validation',
          outcome: 'PASS',
          detail: 'Skipped RP-005: Order not resolved.',
        };
      }
      if (input.order.status === 'CANCELLED') {
        return {
          ruleId: 'RP-005',
          title: 'Order Delivery Status Validation',
          outcome: 'DENY',
          detail: 'Denied under RP-005: Cancelled orders cannot be refunded through this flow.',
        };
      }
      if (input.order.status === 'SHIPPED') {
        return {
          ruleId: 'RP-005',
          title: 'Order Delivery Status Validation',
          outcome: 'ESCALATE',
          detail: 'Escalated under RP-005: Undelivered in-transit order requires shipping investigation.',
        };
      }
      if (input.order.status === 'PLACED') {
        return {
          ruleId: 'RP-005',
          title: 'Order Delivery Status Validation',
          outcome: 'DENY',
          detail: 'Denied under RP-005: Order has not been shipped or delivered.',
        };
      }
      return {
        ruleId: 'RP-005',
        title: 'Order Delivery Status Validation',
        outcome: 'PASS',
        detail: 'Passed RP-005: Order status is DELIVERED.',
      };
    },
  },

  // RP-001: Final Sale Change of Mind Restriction
  {
    id: 'RP-001',
    title: 'Final Sale Change of Mind Restriction',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (input.order?.isFinalSale && input.claimedReason === 'CHANGED_MIND') {
        return {
          ruleId: 'RP-001',
          title: 'Final Sale Change of Mind Restriction',
          outcome: 'DENY',
          detail: 'Denied under RP-001: Final sale items cannot be refunded for change of mind.',
        };
      }
      return {
        ruleId: 'RP-001',
        title: 'Final Sale Change of Mind Restriction',
        outcome: 'PASS',
        detail: 'Passed RP-001: Not a final sale change-of-mind claim.',
      };
    },
  },

  // RP-002: Final Sale Defect Override
  {
    id: 'RP-002',
    title: 'Final Sale Defect Override',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (
        input.order?.isFinalSale &&
        (input.claimedReason === 'DAMAGED' || input.claimedReason === 'WRONG_ITEM')
      ) {
        return {
          ruleId: 'RP-002',
          title: 'Final Sale Defect Override',
          outcome: 'ESCALATE',
          detail:
            'Escalated under RP-002: Damaged or incorrect final-sale items require human specialist review.',
        };
      }
      return {
        ruleId: 'RP-002',
        title: 'Final Sale Defect Override',
        outcome: 'PASS',
        detail: 'Passed RP-002: No final sale defect exception triggered.',
      };
    },
  },

  // RP-009: Premium Tier Return Extension (31-60 Days)
  {
    id: 'RP-009',
    title: 'Premium Tier Return Extension',
    evaluate: (input: PolicyInput): RuleVerdict => {
      const days = getDeliveryDays(input.now, input.order?.deliveredAt ?? null);
      if (days !== null && days > 30 && days <= 60 && input.customer.tier === 'PREMIUM') {
        return {
          ruleId: 'RP-009',
          title: 'Premium Tier Return Extension',
          outcome: 'ESCALATE',
          detail:
            'Escalated under RP-009: Premium customer tier exception (31-60 days) requires concierge review.',
        };
      }
      return {
        ruleId: 'RP-009',
        title: 'Premium Tier Return Extension',
        outcome: 'PASS',
        detail: 'Passed RP-009: No premium tier window extension applicable.',
      };
    },
  },

  // RP-003: Standard Return Window (30 Days)
  {
    id: 'RP-003',
    title: 'Standard Return Window',
    evaluate: (input: PolicyInput): RuleVerdict => {
      const days = getDeliveryDays(input.now, input.order?.deliveredAt ?? null);
      if (days === null) {
        return {
          ruleId: 'RP-003',
          title: 'Standard Return Window',
          outcome: 'PASS',
          detail: 'Skipped RP-003: No delivery timestamp.',
        };
      }

      // If premium customer delivered between 30 and 60 days, handled by RP-009
      if (days > 30 && days <= 60 && input.customer.tier === 'PREMIUM') {
        return {
          ruleId: 'RP-003',
          title: 'Standard Return Window',
          outcome: 'PASS',
          detail: 'Passed RP-003: Standard window deferred to RP-009 premium extension.',
        };
      }

      if (days > 30) {
        return {
          ruleId: 'RP-003',
          title: 'Standard Return Window',
          outcome: 'DENY',
          detail: `Denied under RP-003: Outside 30-day window (delivered ${Math.floor(days)} days ago).`,
        };
      }

      return {
        ruleId: 'RP-003',
        title: 'Standard Return Window',
        outcome: 'PASS',
        detail: `Passed RP-003: Delivered ${Math.floor(days)} days ago (within 30-day window).`,
      };
    },
  },

  // RP-004: High-Value Threshold ($500)
  {
    id: 'RP-004',
    title: 'High-Value Threshold',
    evaluate: (input: PolicyInput): RuleVerdict => {
      const dbAmount = input.order?.totalAmount ?? 0;
      const requested = input.requestedAmount ?? 0;
      // Authoritative ground truth: database order total cannot be bypassed by customer-asserted amount
      const amount = Math.max(dbAmount, requested);
      if (amount > 500) {
        return {
          ruleId: 'RP-004',
          title: 'High-Value Threshold',
          outcome: 'ESCALATE',
          detail: `Escalated under RP-004: High-value claim ($${amount.toFixed(2)} > $500.00) requires supervisory authorization.`,
        };
      }
      return {
        ruleId: 'RP-004',
        title: 'High-Value Threshold',
        outcome: 'PASS',
        detail: `Passed RP-004: Amount ($${amount.toFixed(2)}) is within $500.00 automated limit.`,
      };
    },
  },

  // RP-006: Prior Abuse and Risk Signal
  {
    id: 'RP-006',
    title: 'Prior Abuse and Risk Signal',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (input.customer.riskFlag) {
        return {
          ruleId: 'RP-006',
          title: 'Prior Abuse and Risk Signal',
          outcome: 'ESCALATE',
          detail:
            'Escalated under RP-006: Account flagged with prior refund abuse risk; routed to fraud specialist.',
        };
      }
      return {
        ruleId: 'RP-006',
        title: 'Prior Abuse and Risk Signal',
        outcome: 'PASS',
        detail: 'Passed RP-006: No customer risk flags detected.',
      };
    },
  },

  // RP-008: Ambiguous or Multi-Item Partial Claims
  {
    id: 'RP-008',
    title: 'Ambiguous or Multi-Item Partial Claims',
    evaluate: (input: PolicyInput): RuleVerdict => {
      if (input.claimedReason === 'UNSPECIFIED') {
        return {
          ruleId: 'RP-008',
          title: 'Ambiguous or Multi-Item Partial Claims',
          outcome: 'ESCALATE',
          detail: 'Escalated under RP-008: Unspecified or ambiguous claimed reason.',
        };
      }
      if (input.isPartialClaim && (input.order?.items?.length ?? 0) > 1) {
        return {
          ruleId: 'RP-008',
          title: 'Ambiguous or Multi-Item Partial Claims',
          outcome: 'ESCALATE',
          detail:
            'Escalated under RP-008: Multi-item order with partial refund request requires human review.',
        };
      }
      return {
        ruleId: 'RP-008',
        title: 'Ambiguous or Multi-Item Partial Claims',
        outcome: 'PASS',
        detail: 'Passed RP-008: No ambiguous or multi-item partial criteria.',
      };
    },
  },
];
