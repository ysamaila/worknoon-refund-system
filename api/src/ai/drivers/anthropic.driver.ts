import { Logger } from '@nestjs/common';
import { AiDriver, ExtractionResult, ExtractionResultSchema, ReplyContext } from '../types';
import { buildExtractionUserPrompt, EXTRACTION_SYSTEM_PROMPT } from '../prompts/extract.prompt';
import { buildReplyUserPrompt, REPLY_SYSTEM_PROMPT } from '../prompts/reply.prompt';

export class AnthropicDriver implements AiDriver {
  readonly name = 'anthropic';
  private readonly logger = new Logger(AnthropicDriver.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'claude-3-5-sonnet-20241022',
  ) {}

  async extract(message: string): Promise<ExtractionResult> {
    if (!this.apiKey) {
      throw new Error('[AnthropicDriver] Missing ANTHROPIC_API_KEY.');
    }

    const prompt = buildExtractionUserPrompt(message);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const text = data.content?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in Anthropic response.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return ExtractionResultSchema.parse(parsed);
    } catch (err: any) {
      this.logger.warn(`Anthropic extraction failed: ${err.message}. Falling back.`);
      return {
        orderNumber: undefined,
        claimedReason: 'UNSPECIFIED',
        confidence: 0.5,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async draftReply(ctx: ReplyContext): Promise<string> {
    if (!this.apiKey) return '';

    const prompt = buildReplyUserPrompt(ctx);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          system: REPLY_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      if (!response.ok) return '';
      const data = (await response.json()) as any;
      return data.content?.[0]?.text?.trim() ?? '';
    } catch (err: any) {
      this.logger.warn(`Anthropic drafting failed: ${err.message}`);
      return '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
