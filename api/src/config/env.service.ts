import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { EnvConfig, maskSecret, validateEnv } from './env.schema';

// Load .env from workspace root or api directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

@Injectable()
export class EnvService {
  private readonly logger = new Logger(EnvService.name);
  private readonly config: EnvConfig;

  constructor() {
    this.config = validateEnv(process.env);
    this.logger.log(
      `[EnvSecurity] Initialized configuration in '${this.config.NODE_ENV}' mode | AI Driver: '${this.config.AI_DRIVER}'`,
    );
  }

  get port(): number {
    return this.config.PORT;
  }

  get nodeEnv(): string {
    return this.config.NODE_ENV;
  }

  get isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  get frontendUrl(): string {
    return this.config.FRONTEND_URL;
  }

  get databaseUrl(): string {
    return this.config.DATABASE_URL;
  }

  get aiDriver(): 'mock' | 'deepseek' | 'anthropic' | 'openai' {
    return this.config.AI_DRIVER;
  }

  get deepseek() {
    return {
      apiKey: this.config.DEEPSEEK_API_KEY,
      apiUrl: this.config.DEEPSEEK_API_URL,
      model: this.config.DEEPSEEK_MODEL,
    };
  }

  get anthropicApiKey(): string | undefined {
    return this.config.ANTHROPIC_API_KEY;
  }

  get openaiApiKey(): string | undefined {
    return this.config.OPENAI_API_KEY;
  }

  /**
   * Returns a sanitized view of configuration safe for diagnostics and logging.
   */
  getSanitized(): Record<string, unknown> {
    return {
      port: this.port,
      nodeEnv: this.nodeEnv,
      frontendUrl: this.frontendUrl,
      aiDriver: this.aiDriver,
      deepseek: {
        apiUrl: this.deepseek.apiUrl,
        model: this.deepseek.model,
        apiKey: maskSecret(this.deepseek.apiKey),
      },
      anthropicApiKey: maskSecret(this.anthropicApiKey),
      openaiApiKey: maskSecret(this.openaiApiKey),
    };
  }
}
