import { AiDriver, ExtractionResult, ReplyContext } from '../types';
import { TEMPLATED_REPLIES } from '../guards/consistency.validator';
import { RefundReason } from '../../policy/types';

export class MockDriver implements AiDriver {
  readonly name = 'mock';

  async extract(message: string): Promise<ExtractionResult> {
    const text = message.toLowerCase();

    // 1. Extract order number (e.g. WN-10001 or wn-10423)
    const orderMatch = message.match(/\b(WN-\d+)\b/i);
    const orderNumber = orderMatch ? orderMatch[1].toUpperCase() : undefined;

    // 2. Extract requested dollar amount (e.g. $500, $5,000, 80 dollars)
    let requestedAmount: number | undefined;
    const amountMatch = message.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (amountMatch) {
      const cleanNum = parseFloat(amountMatch[1].replace(/,/g, ''));
      if (!isNaN(cleanNum) && cleanNum > 0) {
        requestedAmount = cleanNum;
      }
    }

    // 3. Classify intent from keyword heuristics
    let claimedReason: RefundReason = 'UNSPECIFIED';

    if (
      text.includes('damaged') ||
      text.includes('broken') ||
      text.includes('cracked') ||
      text.includes('crushed') ||
      text.includes('defective') ||
      text.includes('shattered')
    ) {
      claimedReason = 'DAMAGED';
    } else if (text.includes('wrong') || text.includes('incorrect') || text.includes('different item')) {
      claimedReason = 'WRONG_ITEM';
    } else if (text.includes('not as described') || text.includes('looks different') || text.includes('misleading')) {
      claimedReason = 'NOT_AS_DESCRIBED';
    } else if (
      text.includes('changed mind') ||
      text.includes('no longer want') ||
      text.includes("don't need") ||
      text.includes('accidental')
    ) {
      claimedReason = 'CHANGED_MIND';
    } else if (
      text.includes('never arrived') ||
      text.includes('not delivered') ||
      text.includes('did not arrive') ||
      text.includes('lost package')
    ) {
      claimedReason = 'NEVER_ARRIVED';
    }

    return {
      orderNumber,
      claimedReason,
      requestedAmount,
      confidence: claimedReason === 'UNSPECIFIED' ? 0.6 : 0.95,
    };
  }

  async draftReply(ctx: ReplyContext): Promise<string> {
    // Generate deterministic explanation
    return TEMPLATED_REPLIES[ctx.decision](ctx);
  }
}
