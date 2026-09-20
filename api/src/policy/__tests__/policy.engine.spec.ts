import { describe, it, expect } from 'vitest';
import { evaluate } from '../policy.engine';
import { PolicyInput, CustomerSnapshot, OrderSnapshot } from '../types';

describe('Policy Engine (Deterministic Business Rules)', () => {
  const referenceNow = new Date('2026-09-20T12:00:00Z');
  const daysAgo = (days: number) => new Date(referenceNow.getTime() - days * 86400000);

  const baseCustomer: CustomerSnapshot = {
    id: 'cust-1',
    name: 'Alice Standard',
    email: 'alice@example.com',
    tier: 'STANDARD',
    riskFlag: false,
  };

  const baseOrder: OrderSnapshot = {
    id: 'ord-1',
    orderNumber: 'WN-10001',
    customerId: 'cust-1',
    totalAmount: 100,
    status: 'DELIVERED',
    isFinalSale: false,
    deliveredAt: daysAgo(5),
    placedAt: daysAgo(10),
    items: [{ name: 'Test Item', quantity: 1, unitPrice: 100 }],
  };

  describe('Core 15 Seed Fixtures', () => {
    // 1: Delivered 5 days ago, damaged, $80 -> APPROVED
    it('Fixture 1: Delivered 5 days ago, damaged, $80 -> APPROVED', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, totalAmount: 80, deliveredAt: daysAgo(5) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('APPROVED');
      expect(result.trace.every((t) => t.outcome === 'PASS')).toBe(true);
    });

    // 2: Delivered 5 days ago, wrong item, $120 -> APPROVED
    it('Fixture 2: Delivered 5 days ago, wrong item, $120 -> APPROVED', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, totalAmount: 120, deliveredAt: daysAgo(5) },
        claimedReason: 'WRONG_ITEM',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('APPROVED');
    });

    // 3: Final sale item, damaged -> ESCALATED (RP-002)
    it('Fixture 3: Final sale item, damaged -> ESCALATED (RP-002)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, isFinalSale: true },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp002 = result.trace.find((t) => t.ruleId === 'RP-002');
      expect(rp002?.outcome).toBe('ESCALATE');
    });

    // 4: Final sale, changed mind -> DENIED (RP-001)
    it('Fixture 4: Final sale, changed mind -> DENIED (RP-001)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, isFinalSale: true },
        claimedReason: 'CHANGED_MIND',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      const rp001 = result.trace.find((t) => t.ruleId === 'RP-001');
      expect(rp001?.outcome).toBe('DENY');
    });

    // 5: Delivered 90 days ago -> DENIED (RP-003)
    it('Fixture 5: Delivered 90 days ago -> DENIED (RP-003)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, deliveredAt: daysAgo(90) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      const rp003 = result.trace.find((t) => t.ruleId === 'RP-003');
      expect(rp003?.outcome).toBe('DENY');
    });

    // 6: Delivered 29 days ago (boundary) -> APPROVED
    it('Fixture 6: Delivered 29 days ago (boundary) -> APPROVED', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, deliveredAt: daysAgo(29) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('APPROVED');
    });

    // 7: Delivered 31 days ago (boundary) -> DENIED (RP-003)
    it('Fixture 7: Delivered 31 days ago (boundary) -> DENIED (RP-003)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, deliveredAt: daysAgo(31) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      const rp003 = result.trace.find((t) => t.ruleId === 'RP-003');
      expect(rp003?.outcome).toBe('DENY');
    });

    // 8: $501 damaged (boundary) -> ESCALATED (RP-004)
    it('Fixture 8: $501 damaged (boundary) -> ESCALATED (RP-004)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, totalAmount: 501 },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp004 = result.trace.find((t) => t.ruleId === 'RP-004');
      expect(rp004?.outcome).toBe('ESCALATE');
    });

    // 9: $499 damaged (boundary) -> APPROVED
    it('Fixture 9: $499 damaged (boundary) -> APPROVED', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, totalAmount: 499 },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('APPROVED');
    });

    // 10: Never arrived, status SHIPPED -> ESCALATED (RP-005)
    it('Fixture 10: Never arrived, status SHIPPED -> ESCALATED (RP-005)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, status: 'SHIPPED', deliveredAt: null },
        claimedReason: 'NEVER_ARRIVED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp005 = result.trace.find((t) => t.ruleId === 'RP-005');
      expect(rp005?.outcome).toBe('ESCALATE');
    });

    // 11: Order CANCELLED already -> DENIED (RP-005)
    it('Fixture 11: Order CANCELLED already -> DENIED (RP-005)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, status: 'CANCELLED', deliveredAt: null },
        claimedReason: 'CHANGED_MIND',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      const rp005 = result.trace.find((t) => t.ruleId === 'RP-005');
      expect(rp005?.outcome).toBe('DENY');
    });

    // 12: riskFlag: true -> ESCALATED (RP-006)
    it('Fixture 12: riskFlag: true -> ESCALATED (RP-006)', () => {
      const input: PolicyInput = {
        customer: { ...baseCustomer, riskFlag: true },
        order: baseOrder,
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp006 = result.trace.find((t) => t.ruleId === 'RP-006');
      expect(rp006?.outcome).toBe('ESCALATE');
    });

    // 13: Order does not belong to customer -> DENIED (RP-007)
    it('Fixture 13: Order does not belong to customer -> DENIED (RP-007)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, customerId: 'different-customer-id' },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      const rp007 = result.trace.find((t) => t.ruleId === 'RP-007');
      expect(rp007?.outcome).toBe('DENY');
    });

    // 14: Premium tier, 45 days -> ESCALATED (RP-009)
    it('Fixture 14: Premium tier, 45 days -> ESCALATED (RP-009)', () => {
      const input: PolicyInput = {
        customer: { ...baseCustomer, tier: 'PREMIUM' },
        order: { ...baseOrder, deliveredAt: daysAgo(45) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp009 = result.trace.find((t) => t.ruleId === 'RP-009');
      expect(rp009?.outcome).toBe('ESCALATE');
    });

    // 15: Multi-item partial refund claim -> ESCALATED (RP-008)
    it('Fixture 15: Multi-item partial refund claim -> ESCALATED (RP-008)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: {
          ...baseOrder,
          items: [
            { name: 'Item 1', quantity: 1, unitPrice: 50 },
            { name: 'Item 2', quantity: 1, unitPrice: 50 },
          ],
        },
        claimedReason: 'DAMAGED',
        isPartialClaim: true,
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
      const rp008 = result.trace.find((t) => t.ruleId === 'RP-008');
      expect(rp008?.outcome).toBe('ESCALATE');
    });
  });

  describe('Precedence & Boundary Edge Cases', () => {
    it('Precedence: DENY overrides ESCALATE (abusive user trying to return cancelled order)', () => {
      const input: PolicyInput = {
        customer: { ...baseCustomer, riskFlag: true }, // RP-006: ESCALATE
        order: { ...baseOrder, status: 'CANCELLED' }, // RP-005: DENY
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
    });

    it('Precedence: DENY overrides ESCALATE (high value order >$500 delivered 90 days ago)', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: { ...baseOrder, totalAmount: 1500, deliveredAt: daysAgo(90) },
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED'); // Denied by RP-003 outside window, despite $1500 value
    });

    it('RP-008: Unspecified claimed reason escalates', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: baseOrder,
        claimedReason: 'UNSPECIFIED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('ESCALATED');
    });

    it('Null order triggers DENIED under RP-007', () => {
      const input: PolicyInput = {
        customer: baseCustomer,
        order: null,
        claimedReason: 'DAMAGED',
        now: referenceNow,
      };
      const result = evaluate(input);
      expect(result.decision).toBe('DENIED');
      expect(result.trace.find((t) => t.ruleId === 'RP-007')?.outcome).toBe('DENY');
    });
  });
});
