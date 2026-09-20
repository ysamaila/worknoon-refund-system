import { z } from 'zod';
import { Decision, RuleVerdict } from '../policy/types';

export const ExtractionResultSchema = z.object({
  orderNumber: z.string().optional().nullable(),
  claimedReason: z.enum([
    'DAMAGED',
    'WRONG_ITEM',
    'NOT_AS_DESCRIBED',
    'CHANGED_MIND',
    'NEVER_ARRIVED',
    'UNSPECIFIED',
  ]),
  requestedAmount: z.number().positive().optional().nullable(),
  confidence: z.number().min(0).max(1).default(1.0),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export type ReplyContext = {
  customerName: string;
  orderNumber?: string;
  decision: Decision;
  decisionReason: string;
  ruleTrace: RuleVerdict[];
};

export type AiTelemetry = {
  driver: string;
  model: string;
  latencyMs: number;
  tokensUsed?: number;
  injectionFlag: boolean;
};

export interface AiDriver {
  readonly name: string;
  extract(message: string): Promise<ExtractionResult>;
  draftReply(ctx: ReplyContext): Promise<string>;
}
