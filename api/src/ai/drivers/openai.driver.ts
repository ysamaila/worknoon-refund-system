import { Logger } from '@nestjs/common';
import { AiDriver, ExtractionResult, ExtractionResultSchema, ReplyContext } from '../types';
import { buildExtractionUserPrompt, EXTRACTION_SYSTEM_PROMPT } from '../prompts/extract.prompt';
import { buildReplyUserPrompt, REPLY_SYSTEM_PROMPT } from '../prompts/reply.prompt';

export class OpenAiDriver implements AiDriver {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiDriver.name);

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'gpt-4o-mini',
  ) {}

  async extract(message: string): Promise<ExtractionResult> {
    if (!this.apiKey) {
      throw new Error('[OpenAiDriver] Missing OPENAI_API_KEY.');
    }

    const prompt = buildExtractionUserPrompt(message);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI API returned empty response choice content.');
      }

      const parsed = JSON.parse(content);
      return ExtractionResultSchema.parse(parsed);
    } catch (err: any) {
      this.logger.warn(`OpenAI extraction failed: ${err.message}. Falling back.`);
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: REPLY_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 300,
        }),
        signal: controller.signal,
      });

      if (!response.ok) return '';
      const data = (await response.json()) as any;
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (err: any) {
      this.logger.warn(`OpenAI drafting failed: ${err.message}`);
      return '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
