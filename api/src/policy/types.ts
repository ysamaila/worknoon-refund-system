export type Tier = 'STANDARD' | 'PREMIUM';
export type OrderStatus = 'PLACED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type RefundReason =
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'NEVER_ARRIVED'
  | 'UNSPECIFIED';

export type Decision = 'APPROVED' | 'DENIED' | 'ESCALATED';

export type CustomerSnapshot = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  riskFlag: boolean;
};

export type OrderItemSnapshot = {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type OrderSnapshot = {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  currency?: string;
  status: OrderStatus;
  isFinalSale: boolean;
  deliveredAt: Date | null;
  placedAt: Date;
  items?: OrderItemSnapshot[];
};

export type PolicyInput = {
  order: OrderSnapshot | null;
  customer: CustomerSnapshot;
  claimedReason: RefundReason;
  requestedAmount?: number;
  isPartialClaim?: boolean;
  now: Date; // injected — never call Date.now() inside
};

export type RuleVerdict = {
  ruleId: string; // e.g. 'RP-003'
  title: string;
  outcome: 'PASS' | 'DENY' | 'ESCALATE';
  detail: string; // human sentence for the audit log
};

export type PolicyResult = {
  decision: Decision;
  reason: string;
  trace: RuleVerdict[];
};
