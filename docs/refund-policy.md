# Worknoon Refund Policy Specification

**Document Reference:** WN-POL-REFUND-2026-V1  
**Classification:** Public / Customer-Facing & Operational Standard  
**Effective Date:** 1 September 2026  

---

## 1. Executive Summary

This document formalizes the deterministic rules governing automated and human-reviewed refund requests for Worknoon e-commerce operations. All automated refund systems and customer support agents are strictly bound to these rules.

The evaluation engine enforces the following resolution hierarchy across all claims:
$$\text{DENY} \succ \text{ESCALATE} \succ \text{APPROVED}$$

If any single rule triggers a `DENY`, the claim is rejected outright. If no rule denies the claim but at least one rule triggers an `ESCALATE`, the request is routed to a human specialist. A claim is `APPROVED` if and only if all applicable rules pass.

---

## 2. Rule Catalog

### RP-001: Final Sale Restriction
- **Summary:** Items purchased under promotional or "Final Sale" clearance terms cannot be refunded for standard returns or customer change of mind.
- **Trigger Condition:** Order marked as `isFinalSale: true` AND claimed reason is `CHANGED_MIND` or discretionary return.
- **Verdict:** `DENY`
- **Audit Detail:** "Final sale items are non-refundable for change of mind."

---

### RP-002: Defective, Damaged, or Incorrect Items on Final Sale
- **Summary:** Defective or damaged items qualify for review regardless of final-sale designation, but require human specialist inspection.
- **Trigger Condition:** Order marked as `isFinalSale: true` AND claimed reason is `DAMAGED` or `WRONG_ITEM`.
- **Verdict:** `ESCALATE`
- **Audit Detail:** "Damaged or incorrect final-sale items require human specialist review."

---

### RP-003: Standard Return Window (30 Days)
- **Summary:** Orders delivered more than 30 calendar days prior to the request timestamp are outside the statutory return window.
- **Trigger Condition:** Order delivery date $> 30$ days from request timestamp ($\Delta t > 30 \times 86,400\text{ s}$).
- **Verdict:** `DENY`
- **Audit Detail:** "Return window exceeded. Requests must be submitted within 30 days of delivery."

---

### RP-004: High-Value Threshold ($500)
- **Summary:** Any single refund claim exceeding $500.00 requires supervisory authorization and cannot be approved autonomously.
- **Trigger Condition:** Verified order total or requested refund amount $> \$500.00$.
- **Verdict:** `ESCALATE`
- **Audit Detail:** "High-value claim ($> $500.00) requires supervisory authorization."

---

### RP-005: Order Delivery Status Validation
- **Summary:** Refunds through this automated customer self-service channel can only be issued for orders that have been successfully delivered. Undelivered or cancelled orders must follow cancellation/shipping carrier claims.
- **Trigger Condition:**
  - Order status is `CANCELLED`: `DENY` ("Order is already cancelled; no delivery to refund.")
  - Order status is `SHIPPED` / in-transit: `ESCALATE` ("Order is currently in transit; routed to shipping investigation.")
  - Order status is `PLACED`: `DENY` ("Order not yet shipped or delivered.")
- **Verdict:** `DENY` or `ESCALATE`
- **Audit Detail:** "Order status must be DELIVERED to process an automated return."

---

### RP-006: Prior Abuse and Risk Signal
- **Summary:** Accounts flagged with excessive refund frequencies, suspicious return behavior, or high risk scores cannot receive automated approval.
- **Trigger Condition:** Customer profile has `riskFlag: true`.
- **Verdict:** `ESCALATE`
- **Audit Detail:** "Account flagged with risk signal; routed to fraud prevention specialist."

---

### RP-007: Account Ownership Verification
- **Summary:** A customer may only claim refunds against orders that originate from their own verified customer account. Cross-account claims are rejected.
- **Trigger Condition:** Order's `customerId` does not match the requesting `customer.id`.
- **Verdict:** `DENY`
- **Audit Detail:** "Order does not belong to the requesting customer account."

---

### RP-008: Ambiguous, Contradictory, or Multi-Item Partial Claims
- **Summary:** If a customer's claim contains ambiguous statements, unresolvable reasons, or partial refund requests on multi-item orders requiring item-level discretion, it must be escalated to a human.
- **Trigger Condition:** Claimed reason is `UNSPECIFIED` or multi-item order without explicit single-item breakdown.
- **Verdict:** `ESCALATE`
- **Audit Detail:** "Claim contains ambiguous or multi-item partial criteria requiring manual adjustment."

---

### RP-009: Premium Customer Tier Return Extension
- **Summary:** Customers in the `PREMIUM` tier are granted an extended return window of up to 60 calendar days (beyond the standard 30 days), subject to human specialist confirmation.
- **Trigger Condition:** Customer tier is `PREMIUM` AND delivery date is between 31 and 60 days.
- **Verdict:** `ESCALATE`
- **Audit Detail:** "Premium customer tier exception ($31\text{--}60$ days); routed to VIP concierge review."
