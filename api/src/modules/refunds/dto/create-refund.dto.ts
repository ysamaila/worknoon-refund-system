import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const CreateRefundSchema = z.object({
  customerId: z.string().uuid({ message: 'customerId must be a valid UUID' }),
  orderNumber: z.string().optional(),
  rawMessage: z.string().min(3, { message: 'rawMessage must be at least 3 characters' }),
  isPartialClaim: z.boolean().optional(),
});

export class CreateRefundDto {
  @ApiProperty({ description: 'Customer UUID submitting the request', example: 'c1000000-0000-0000-0000-000000000001' })
  customerId!: string;

  @ApiPropertyOptional({ description: 'Optional order number (e.g. WN-10001). Can be omitted if included in message.', example: 'WN-10001' })
  orderNumber?: string;

  @ApiProperty({ description: 'Exact free-form message submitted by the customer', example: 'My order WN-10001 arrived with a broken headphone band.' })
  rawMessage!: string;

  @ApiPropertyOptional({ description: 'Whether this claim is a partial refund on a multi-item order', default: false })
  isPartialClaim?: boolean;
}
