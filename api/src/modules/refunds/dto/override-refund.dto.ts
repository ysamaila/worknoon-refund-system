import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const OverrideRefundSchema = z.object({
  decision: z.enum(['APPROVED', 'DENIED'], {
    errorMap: () => ({ message: "decision must be either 'APPROVED' or 'DENIED'" }),
  }),
  overrideReason: z
    .string()
    .min(5, { message: 'overrideReason must be at least 5 characters explaining the decision' }),
  operatorName: z.string().optional().default('Support Supervisor'),
});

export class OverrideRefundDto {
  @ApiProperty({
    description: 'Manual human resolution verdict',
    enum: ['APPROVED', 'DENIED'],
    example: 'APPROVED',
  })
  decision!: 'APPROVED' | 'DENIED';

  @ApiProperty({
    description: 'Mandatory justification for overriding the automated escalation',
    example: 'Verified customer returned product with tracking number 1Z9999999999. Approved goodwill refund.',
  })
  overrideReason!: string;

  @ApiPropertyOptional({
    description: 'Name or identifier of the human operator performing the override',
    default: 'Support Supervisor',
    example: 'Jane Doe (Fraud Lead)',
  })
  operatorName?: string;
}
