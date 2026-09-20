import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EnvService } from './config/env.service';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly envService: EnvService) {}

  @Get()
  @ApiOperation({ summary: 'System Health and Diagnostics' })
  @ApiResponse({
    status: 200,
    description: 'System operational status and active AI driver configuration',
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.envService.nodeEnv,
      aiDriver: this.envService.aiDriver,
      config: this.envService.getSanitized(),
    };
  }
}
