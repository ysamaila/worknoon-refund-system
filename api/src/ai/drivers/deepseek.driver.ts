import { Logger } from '@nestjs/common';
import { AiDriver, ExtractionResult, ExtractionResultSchema, ReplyContext } from '../types';
import { buildExtractionUserPrompt, EXTRACTION_SYSTEM_PROMPT } from '../prompts/extract.prompt';
import { buildReplyUserPrompt, REPLY_SYSTEM_PROMPT } from '../prompts/reply.prompt';

export class DeepSeekDriver implements AiDriver {
  readonly name = 'deepseek';
  private readonly logger = new Logger(DeepSeekDriver.name);

  constructor(
    private readonly apiKey: string,
    private readonly apiUrl: string = 'https://api.deepseek.com/chat/completions',
    private readonly model: string = 'deepseek-chat',
  ) {
    if (!this.apiKey) {
      throw new Error('[DeepSeekDriver] Missing DEEPSEEK_API_KEY in environment.');
    }
  }

  async extract(message: string): Promise<ExtractionResult> {
    const prompt = buildExtractionUserPrompt(message);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.apiUrl, {
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
        throw new Error(`DeepSeek API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('DeepSeek API returned empty response choice content.');
      }

      const parsed = JSON.parse(content);
      const validated = ExtractionResultSchema.parse(parsed);
      return validated;
    } catch (err: any) {
      this.logger.warn(`DeepSeek extraction failed: ${err.message}. Falling back to default extraction.`);
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
    const prompt = buildReplyUserPrompt(ctx);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(this.apiUrl, {
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API returned HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      return content?.trim() ?? '';
    } catch (err: any) {
      this.logger.warn(`DeepSeek reply drafting failed: ${err.message}.`);
      return '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
