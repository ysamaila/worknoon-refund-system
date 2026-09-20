import { Inject, Injectable, Logger } from '@nestjs/common';
import { EnvService } from '../config/env.service';
import { AiDriver, AiTelemetry, ExtractionResult, ReplyContext } from './types';
import { MockDriver } from './drivers/mock.driver';
import { DeepSeekDriver } from './drivers/deepseek.driver';
import { AnthropicDriver } from './drivers/anthropic.driver';
import { OpenAiDriver } from './drivers/openai.driver';
import { checkPromptInjection, InjectionCheckResult } from './guards/injection.guard';
import { resolveCustomerReply } from './guards/consistency.validator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly driver: AiDriver;

  constructor(@Inject(EnvService) private readonly envService: EnvService) {
    const driverType = this.envService.aiDriver;

    switch (driverType) {
      case 'deepseek': {
        const apiKey = this.envService.deepseek.apiKey;
        if (apiKey) {
          this.driver = new DeepSeekDriver(
            apiKey,
            this.envService.deepseek.apiUrl,
            this.envService.deepseek.model,
          );
        } else {
          this.logger.warn('AI_DRIVER set to deepseek but no DEEPSEEK_API_KEY found. Falling back to mock driver.');
          this.driver = new MockDriver();
        }
        break;
      }
      case 'anthropic': {
        const apiKey = this.envService.anthropicApiKey;
        if (apiKey) {
          this.driver = new AnthropicDriver(apiKey);
        } else {
          this.logger.warn('AI_DRIVER set to anthropic but no ANTHROPIC_API_KEY found. Falling back to mock driver.');
          this.driver = new MockDriver();
        }
        break;
      }
      case 'openai': {
        const apiKey = this.envService.openaiApiKey;
        if (apiKey) {
          this.driver = new OpenAiDriver(apiKey);
        } else {
          this.logger.warn('AI_DRIVER set to openai but no OPENAI_API_KEY found. Falling back to mock driver.');
          this.driver = new MockDriver();
        }
        break;
      }
      case 'mock':
      default:
        this.driver = new MockDriver();
        break;
    }

    this.logger.log(`Initialized AiService with driver: '${this.driver.name}'`);
  }

  get activeDriver(): AiDriver {
    return this.driver;
  }

  /**
   * Evaluates prompt injection heuristics and extracts structured fields from customer message.
   */
  async extractIntent(rawMessage: string): Promise<{
    extraction: ExtractionResult;
    injection: InjectionCheckResult;
    telemetry: AiTelemetry;
  }> {
    const startTime = Date.now();

    // 1. Layer 4: Heuristic Prompt Injection Pre-Screen
    const injection = checkPromptInjection(rawMessage);
    if (injection.isFlagged) {
      this.logger.warn(
        `[Security] Prompt injection flagged: [${injection.matchedPatterns.join(', ')}]`,
      );
    }

    // 2. Extract facts via AI driver
    const extraction = await this.driver.extract(rawMessage);

    const latencyMs = Date.now() - startTime;
    const telemetry: AiTelemetry = {
      driver: this.driver.name,
      model: this.driver.name === 'deepseek' ? this.envService.deepseek.model : this.driver.name,
      latencyMs,
      injectionFlag: injection.isFlagged,
    };

    return {
      extraction,
      injection,
      telemetry,
    };
  }

  /**
   * Drafts an empathetic customer reply conditioned on the decision and rule trace,
   * with Layer 5 contradiction validation and template fallback recovery.
   */
  async generateCustomerReply(ctx: ReplyContext): Promise<{
    reply: string;
    usedFallback: boolean;
    fallbackReason?: string;
    telemetry: AiTelemetry;
  }> {
    const startTime = Date.now();

    let rawDraft = '';
    try {
      rawDraft = await this.driver.draftReply(ctx);
    } catch (err: any) {
      this.logger.warn(`Driver draftReply threw error: ${err.message}`);
    }

    // Layer 5: Output consistency validation & template fallback
    const resolved = resolveCustomerReply(rawDraft, ctx);
    if (resolved.usedFallback) {
      this.logger.log(
        `[ConsistencyGuard] Triggered fallback template for decision: ${ctx.decision}. Reason: ${resolved.fallbackReason}`,
      );
    }

    const latencyMs = Date.now() - startTime;
    const telemetry: AiTelemetry = {
      driver: this.driver.name,
      model: this.driver.name === 'deepseek' ? this.envService.deepseek.model : this.driver.name,
      latencyMs,
      injectionFlag: false,
    };

    return {
      reply: resolved.reply,
      usedFallback: resolved.usedFallback,
      fallbackReason: resolved.fallbackReason,
      telemetry,
    };
  }
}
