# Worknoon Refund System — System Architecture & Request Lifecycle

## 1. Architectural Philosophy

The core thesis of the Worknoon Refund System is:
> **The LLM classifies intent and writes the explanation. A deterministic, unit-tested policy engine makes the decision. Ground truth always comes from the database, never from the customer's message.**

Money is never authorized by probabilistic language models. Instead:
- **Language Layer (Scoped LLM):** Extracts customer intent, flags prompt manipulations, and drafts empathetic responses conditioned strictly on finalized decisions.
- **Decision Layer (Deterministic Pure TypeScript):** Evaluates authoritative database facts against published business rules (`RP-001` through `RP-009`) with resolution precedence: **`DENY` > `ESCALATE` > `APPROVED`**.
- **Data Layer (PostgreSQL 16 + Prisma):** Serves as the sole authoritative source of truth for order amounts, delivery timestamps, return windows, item types, and customer risk flags.

---

## 2. Component Diagram

```mermaid
graph TD
    Client["Next.js Web Frontend (Port 3000)<br/>- Customer Portal (/)<br/>- Admin Operations Console (/admin)"]
    API["NestJS Backend API (Port 4000)<br/>- REST Endpoints<br/>- Swagger Docs (/api/docs)"]
    DB[("PostgreSQL 16 Database<br/>Authoritative Ground Truth")]
    
    subgraph Core ["Deterministic Core (Pure TypeScript)"]
        PolicyEngine["Policy Engine<br/>rules.ts & policy.engine.ts<br/>Rules RP-001 to RP-009"]
    end
    
    subgraph AI ["AI Adapter Layer (Scoped)"]
        AiService["AiService Orchestrator"]
        Drivers["AiDriver Adapters<br/>(Mock, DeepSeek, Anthropic, OpenAI)"]
        Guards["5-Layer Prompt Injection Guards<br/>& Output Consistency Validator"]
    end

    Client -->|HTTP / JSON| API
    API -->|Authoritative Queries| DB
    API -->|Raw Input / Draft Requests| AI
    API -->|Ground Truth Snapshots| Core
    Core -->|Deterministic Verdict & Rule Trace| API
```

---

## 3. End-to-End 9-Stage Request Lifecycle

When a customer submits a refund claim via `POST /api/refunds`:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    participant API as RefundsController
    participant Guard as Injection Guard
    participant AI as AI Service (LLM)
    participant DB as PostgreSQL (Prisma)
    participant Engine as Policy Engine
    participant Validator as Consistency Validator
    actor Admin as Support Supervisor

    Customer->>API: POST /api/refunds (rawMessage, customerId, orderNumber?)
    API->>Guard: 1. Heuristic Pre-screen
    Guard-->>API: Result: clean or flagged (injectionFlag: true)
    
    API->>AI: 2. Intent & Entity Extraction (XML boundary isolated)
    AI-->>API: { claimedReason, confidence, orderNumber? }
    
    API->>DB: 3. Authoritative DB Lookup (Customer & Order Facts)
    DB-->>API: Verified Order Snapshot (Status, Amount, Delivery Date, Final Sale)
    
    API->>Engine: 4. Evaluate Policy (RP-001 to RP-009)
    Note over Engine: Precedence: DENY > ESCALATE > APPROVED
    Engine-->>API: { decision, decisionReason, policyTrace }
    
    API->>AI: 5. Draft Customer Reply (Constrained by finalized decision)
    AI-->>API: Drafted Reply
    
    API->>Validator: 6. Output Consistency Check (Reject contradictions)
    Validator-->>API: Validated Reply (or hardened fallback template)
    
    API->>DB: 7. Persist Request, policyTrace, aiTrace
    DB-->>API: Saved Record
    
    API-->>Customer: 8. Verdict, Empathy Reply & Collapsible Rule Trace
    
    opt If ESCALATED (Manual Supervisor Review)
        Admin->>API: POST /api/refunds/:id/override (decision, overrideReason)
        API->>DB: Append HUMAN-OVERRIDE to policyTrace & update decision
        DB-->>Admin: Updated Record with Audit Trail
    end
```

---

## 4. Architectural Separation of Concerns

The repository structure reinforces the separation between policy and AI:
- `api/src/policy/`: Has **zero dependencies** on external packages, AI services, network, or databases. Takes pure snapshots and returns deterministic verdicts.
- `api/src/ai/`: Handles language tasks only. Outputs typed Zod schemas. Has no ability to change policy rules or write to financial records.
- `api/src/modules/refunds/`: Orchestrates the pipeline, passing verified database facts into the policy engine and logging both `policyTrace` and `aiTrace` independently.
