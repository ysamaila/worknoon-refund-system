# Worknoon AI-Powered Customer Support Refund System

> **Core Architectural Principle:** The LLM classifies intent and writes the explanation. A deterministic, unit-tested policy engine makes the decision. Ground truth always comes from the database, never from the customer's message.

---

## Project Description

The **Worknoon Refund System** is a production-oriented, full-stack customer support platform that automates e-commerce refund workflows while eliminating financial risk. Instead of delegating financial authorization to an unpredictable Large Language Model, the system employs a deterministic, unit-tested policy engine to evaluate eligibility against authoritative database records.

The AI layer is strictly scoped behind an adapter interface to:
- **Extract Customer Intent:** Parse unstructured natural-language messages into strictly validated schemas (`claimedReason`, `orderNumber`, `requestedAmount`).
- **Defend Against Injections:** Structural boundaries and heuristic pre-screening detect jailbreaks and prompt manipulation, routing attacks directly to human review.
- **Draft Empathetic Explanations:** Generate customer-facing replies conditioned directly on deterministic rule verdicts and verified database facts.

### Tech Stack
- **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **AI Engine:** Multi-driver adapter interface (Mock, DeepSeek, Anthropic, OpenAI)
- **Policy Engine:** Pure, dependency-free TypeScript with strict precedence resolution ($\text{DENY} \succ \text{ESCALATE} \succ \text{APPROVED}$)

---

## Project Documents

* [**Refund Policy Specification (`docs/refund-policy.md`)**](docs/refund-policy.md)  
  Authoritative specification of business policy rules `RP-001` through `RP-009`, resolution hierarchies, return window calculations, and tier eligibility boundaries.

* [**System Architecture & Request Lifecycle (`docs/architecture.md`)**](docs/architecture.md)  
  System component diagrams, architectural boundaries isolating probabilistic LLM outputs from deterministic financial rules, and the complete 9-stage request lifecycle pipeline.