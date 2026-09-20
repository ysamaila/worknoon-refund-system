export type Tier = 'STANDARD' | 'PREMIUM';
export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type Decision = 'APPROVED' | 'DENIED' | 'ESCALATED';

export type Customer = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  riskFlag: boolean;
  createdAt: string;
  _count?: { orders: number; refundRequests: number };
};

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  isFinalSale: boolean;
  deliveredAt: string | null;
  placedAt: string;
  items?: OrderItem[];
};

export type RuleVerdict = {
  ruleId: string;
  title: string;
  outcome: 'PASS' | 'DENY' | 'ESCALATE';
  detail: string;
};

export type RefundRecord = {
  id: string;
  customerId: string;
  orderId?: string | null;
  rawMessage: string;
  classifiedIntent: string;
  claimedReason: string;
  decision: Decision;
  decisionReason: string;
  customerReply: string;
  policyTrace: RuleVerdict[];
  aiTrace: {
    extraction?: {
      orderNumber?: string;
      claimedReason: string;
      confidence: number;
      telemetry?: { driver: string; model: string; latencyMs: number };
    };
    replyDraft?: {
      usedFallback: boolean;
      fallbackReason?: string;
      telemetry?: { driver: string; model: string; latencyMs: number };
    };
    injectionCheck?: {
      isFlagged: boolean;
      matchedPatterns: string[];
    };
  };
  injectionFlag: boolean;
  createdAt: string;
  customer?: Customer;
  order?: Order | null;
};

export type ReviewStatus = 'NEEDS_ATTENTION' | 'ATTENDED_BY_HUMAN' | 'AUTO_RESOLVED';

export function getReviewStatus(refund: RefundRecord): ReviewStatus {
  const hasHumanOverride =
    Array.isArray(refund.policyTrace) &&
    refund.policyTrace.some((r) => r.ruleId === 'HUMAN-OVERRIDE');

  if (hasHumanOverride) {
    return 'ATTENDED_BY_HUMAN';
  }
  if (refund.decision === 'ESCALATED') {
    return 'NEEDS_ATTENTION';
  }
  return 'AUTO_RESOLVED';
}

export function getHumanOverrideDetails(refund: RefundRecord): { detail: string; timestamp?: string } | null {
  if (!Array.isArray(refund.policyTrace)) return null;
  const overrideRule = refund.policyTrace.find((r) => r.ruleId === 'HUMAN-OVERRIDE');
  if (!overrideRule) return null;
  return {
    detail: overrideRule.detail,
    timestamp: (overrideRule as any).timestamp,
  };
}
