import { describe, it, expect } from 'vitest';
import { AiService } from '../ai.service';
import { EnvService } from '../../config/env.service';
import { validateReplyConsistency, resolveCustomerReply } from '../guards/consistency.validator';
import { ReplyContext } from '../types';

describe('AI Service & Consistency Guard (Layer 5)', () => {
  const mockEnvService = {
    aiDriver: 'mock',
    deepseek: { apiKey: undefined, apiUrl: '', model: '' },
    anthropicApiKey: undefined,
    openaiApiKey: undefined,
  } as unknown as EnvService;

  const aiService = new AiService(mockEnvService);

  const baseContext: ReplyContext = {
    customerName: 'Alice',
    orderNumber: 'WN-10001',
    decision: 'DENIED',
    decisionReason: 'Outside 30-day window',
    ruleTrace: [
      {
        ruleId: 'RP-003',
        title: 'Return Window',
        outcome: 'DENY',
        detail: 'Outside 30-day window',
      },
    ],
  };

  describe('Extraction via Mock Driver', () => {
    it('Extracts order number and damaged reason accurately', async () => {
      const message = 'Hello, my order WN-10005 arrived damaged and broken with shattered glass.';
      const result = await aiService.extractIntent(message);

      expect(result.extraction.orderNumber).toBe('WN-10005');
      expect(result.extraction.claimedReason).toBe('DAMAGED');
      expect(result.extraction.confidence).toBeGreaterThan(0.8);
      expect(result.injection.isFlagged).toBe(false);
    });

    it('Extracts dollar amount when present', async () => {
      const message = 'I want a refund of $120.50 for WN-10002 because you sent the wrong item.';
      const result = await aiService.extractIntent(message);

      expect(result.extraction.orderNumber).toBe('WN-10002');
      expect(result.extraction.claimedReason).toBe('WRONG_ITEM');
      expect(result.extraction.requestedAmount).toBe(120.5);
    });
  });

  describe('Layer 5: Decision Contradiction Detection', () => {
    it('Detects contradiction when model drafts approval for a DENIED decision', () => {
      const contradictoryDraft =
        'Great news Alice! We have approved your refund for order WN-10001. You will receive your refund in 3 days.';
      const check = validateReplyConsistency(contradictoryDraft, 'DENIED');

      expect(check.isValid).toBe(false);
      expect(check.reason).toContain('Model drafted approval phrase');
    });

    it('Detects contradiction when model drafts denial for an APPROVED decision', () => {
      const contradictoryDraft =
        'Unfortunately, we cannot authorize a refund for order WN-10001 as it is not eligible for a refund.';
      const check = validateReplyConsistency(contradictoryDraft, 'APPROVED');

      expect(check.isValid).toBe(false);
      expect(check.reason).toContain('Model drafted denial phrase');
    });

    it('Replaces contradictory draft with a hardened deterministic template', () => {
      const contradictoryDraft = 'Congratulations! We have approved your refund.';
      const resolved = resolveCustomerReply(contradictoryDraft, baseContext);

      expect(resolved.usedFallback).toBe(true);
      expect(resolved.reply).toContain('Unfortunately, we cannot authorize a refund');
      expect(resolved.reply).toContain('Outside 30-day window');
    });

    it('Preserves consistent model drafts without fallback', () => {
      const consistentDraft =
        'Hello Alice, we reviewed your request for WN-10001. Unfortunately, we cannot accept returns after 30 days.';
      const resolved = resolveCustomerReply(consistentDraft, baseContext);

      expect(resolved.usedFallback).toBe(false);
      expect(resolved.reply).toBe(consistentDraft);
    });
  });

  describe('End-to-End Reply Generation Flow', () => {
    it('Generates consistent customer reply with telemetry', async () => {
      const approvedContext: ReplyContext = {
        ...baseContext,
        decision: 'APPROVED',
        decisionReason: 'Eligible damage claim within 30 days',
      };

      const result = await aiService.generateCustomerReply(approvedContext);
      expect(result.reply).toContain('has been approved');
      expect(result.telemetry.driver).toBe('mock');
      expect(result.telemetry.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });
});
