import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EnvService } from '../../config/env.service';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly targetUrl: string;

  constructor(private readonly envService: EnvService) {
    this.targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.KEEP_ALIVE_URL ||
      'https://worknoon-refund-system.onrender.com';
  }

  onModuleInit() {
    // Disable keep-alive background loop during test runs
    if (this.envService.nodeEnv === 'test') {
      return;
    }

    this.logger.log(
      `[KeepAlive] Service active. Target URL: ${this.targetUrl}/api/health`,
    );
    this.scheduleNextPing();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Generates a random integer interval between min and max minutes (inclusive).
   */
  private getRandomIntervalMinutes(min = 5, max = 9): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private scheduleNextPing() {
    const minutes = this.getRandomIntervalMinutes(5, 9);
    const delayMs = minutes * 60 * 1000;

    this.logger.log(
      `[KeepAlive] Next keep-alive ping scheduled in ${minutes} minutes.`,
    );

    this.timer = setTimeout(async () => {
      await this.ping();
      this.scheduleNextPing();
    }, delayMs);

    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  private async ping() {
    const pingEndpoint = `${this.targetUrl.replace(/\/$/, '')}/api/health`;
    try {
      const startTime = Date.now();
      const res = await fetch(pingEndpoint, {
        headers: {
          'User-Agent': 'Worknoon-KeepAlive-Trigger/1.0',
        },
      });
      const latency = Date.now() - startTime;

      if (res.ok) {
        this.logger.log(
          `[KeepAlive] Ping successful (${res.status} OK in ${latency}ms) -> ${pingEndpoint}`,
        );
      } else {
        this.logger.warn(
          `[KeepAlive] Ping responded with status ${res.status} -> ${pingEndpoint}`,
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[KeepAlive] Ping failed: ${errorMsg}`);
    }
  }
}
