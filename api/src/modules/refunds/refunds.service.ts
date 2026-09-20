import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { evaluate } from '../../policy/policy.engine';
import { CustomerSnapshot, Decision, OrderSnapshot, PolicyInput } from '../../policy/types';
import { CreateRefundDto, CreateRefundSchema } from './dto/create-refund.dto';
import { OverrideRefundDto, OverrideRefundSchema } from './dto/override-refund.dto';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AiService) private readonly aiService: AiService,
  ) {}

  /**
   * 9-Stage Refund Processing Pipeline
   */
  async processRefundRequest(dto: CreateRefundDto, injectedNow: Date = new Date()) {
    // 1. Validate DTO (Zod)
    const validatedDto = CreateRefundSchema.safeParse(dto);
    if (!validatedDto.success) {
      throw new BadRequestException({
        message: 'Invalid refund request payload',
        details: validatedDto.error.format(),
      });
    }

    const { customerId, rawMessage } = validatedDto.data;

    // Retrieve verified Customer from DB (authoritative facts)
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID '${customerId}' not found.`);
    }

    // 2. Heuristic Prompt Injection Pre-screen & 3. AI Extraction
    const { extraction, injection, telemetry: extractTelemetry } =
      await this.aiService.extractIntent(rawMessage);

    // 4. Resolve Order from DB (Authoritative ground truth)
    const targetOrderNumber = validatedDto.data.orderNumber || extraction.orderNumber;
    let orderRecord = null;

    if (targetOrderNumber) {
      orderRecord = await this.prisma.order.findUnique({
        where: { orderNumber: targetOrderNumber },
        include: { items: true },
      });
    }

    // 5. Deterministic Policy Engine Evaluation (Pure TypeScript)
    const customerSnapshot: CustomerSnapshot = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      tier: customer.tier,
      riskFlag: customer.riskFlag,
    };

    const orderSnapshot: OrderSnapshot | null = orderRecord
      ? {
          id: orderRecord.id,
          orderNumber: orderRecord.orderNumber,
          customerId: orderRecord.customerId,
          totalAmount: Number(orderRecord.totalAmount),
          currency: orderRecord.currency,
          status: orderRecord.status,
          isFinalSale: orderRecord.isFinalSale,
          deliveredAt: orderRecord.deliveredAt,
          placedAt: orderRecord.placedAt,
          items: orderRecord.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          })),
        }
      : null;

    const policyInput: PolicyInput = {
      customer: customerSnapshot,
      order: orderSnapshot,
      claimedReason: extraction.claimedReason,
      requestedAmount: extraction.requestedAmount ?? undefined,
      isPartialClaim: validatedDto.data.isPartialClaim,
      now: injectedNow,
    };

    const policyResult = evaluate(policyInput);

    let finalDecision: Decision = policyResult.decision;
    let finalReason = policyResult.reason;

    // Security Guard: If prompt injection detected, force ESCALATED unless already DENIED
    if (injection.isFlagged) {
      if (finalDecision !== 'DENIED') {
        finalDecision = 'ESCALATED';
        finalReason = `Flagged by security heuristics: prompt injection attempt detected (${injection.matchedPatterns.join(
          ', ',
        )}). Routed to human supervisor review.`;
      }
    }

    // 6. AI Draft Customer Reply & 7. Validate Reply Consistency
    const { reply: customerReply, usedFallback, fallbackReason, telemetry: replyTelemetry } =
      await this.aiService.generateCustomerReply({
        customerName: customer.name,
        orderNumber: orderRecord?.orderNumber,
        decision: finalDecision,
        decisionReason: finalReason,
        ruleTrace: policyResult.trace,
      });

    // 8. Persist with Segregated policyTrace and aiTrace JSON columns
    const combinedAiTrace = {
      extraction: {
        orderNumber: extraction.orderNumber,
        claimedReason: extraction.claimedReason,
        confidence: extraction.confidence,
        telemetry: extractTelemetry,
      },
      replyDraft: {
        usedFallback,
        fallbackReason,
        telemetry: replyTelemetry,
      },
      injectionCheck: injection,
    };

    const record = await this.prisma.refundRequest.create({
      data: {
        customerId: customer.id,
        orderId: orderRecord?.id ?? null,
        rawMessage,
        classifiedIntent: extraction.claimedReason,
        claimedReason: extraction.claimedReason,
        decision: finalDecision,
        decisionReason: finalReason,
        customerReply,
        policyTrace: policyResult.trace as any,
        aiTrace: combinedAiTrace as any,
        injectionFlag: injection.isFlagged,
      },
      include: {
        customer: true,
        order: { include: { items: true } },
      },
    });

    this.logger.log(
      `[Pipeline] Processed refund request ${record.id} for customer ${customer.name} -> ${finalDecision} (${finalReason})`,
    );

    // 9. Return Client Response
    return {
      id: record.id,
      decision: finalDecision,
      decisionReason: finalReason,
      customerReply,
      order: orderRecord
        ? {
            orderNumber: orderRecord.orderNumber,
            totalAmount: Number(orderRecord.totalAmount),
            status: orderRecord.status,
            isFinalSale: orderRecord.isFinalSale,
          }
        : null,
      policyTrace: policyResult.trace,
      aiTrace: combinedAiTrace,
      injectionFlag: injection.isFlagged,
      createdAt: record.createdAt,
    };
  }

  /**
   * List refunds for Admin Dashboard
   */
  async listRefunds(options: { decision?: Decision; page?: number; limit?: number }) {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(50, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = options.decision ? { decision: options.decision } : {};

    const [total, items] = await Promise.all([
      this.prisma.refundRequest.count({ where }),
      this.prisma.refundRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, email: true, tier: true, riskFlag: true } },
          order: { select: { orderNumber: true, totalAmount: true, status: true, isFinalSale: true } },
        },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single refund record with complete audit trace
   */
  async getRefundById(id: string) {
    const refund = await this.prisma.refundRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: true } },
      },
    });

    if (!refund) {
      throw new NotFoundException(`RefundRequest with ID '${id}' not found.`);
    }

    return refund;
  }

  /**
   * Human Escalation Override
   * Allows human operators to resolve an ESCALATED claim
   */
  async overrideEscalation(id: string, dto: OverrideRefundDto) {
    const validated = OverrideRefundSchema.safeParse(dto);
    if (!validated.success) {
      throw new BadRequestException({
        message: 'Invalid override payload',
        details: validated.error.format(),
      });
    }

    const refund = await this.getRefundById(id);

    const { decision, overrideReason, operatorName } = validated.data;

    // Append human override audit entry to policyTrace
    const currentTrace = Array.isArray(refund.policyTrace) ? (refund.policyTrace as any[]) : [];
    const overrideAuditEntry = {
      ruleId: 'HUMAN-OVERRIDE',
      title: 'Human Supervisory Resolution',
      outcome: decision,
      detail: `Overridden by ${operatorName}: ${overrideReason}`,
      timestamp: new Date().toISOString(),
    };
    const updatedPolicyTrace = [...currentTrace, overrideAuditEntry];

    // Generate updated customer notification
    const customerReply =
      decision === 'APPROVED'
        ? `Hello ${refund.customer.name}, following manual supervisory review by our support leadership, your refund request for order ${refund.order?.orderNumber ?? 'reference'} has been approved (${overrideReason}). Credit will be issued in 3-5 business days.`
        : `Hello ${refund.customer.name}, following manual review by our support leadership, we regret to inform you that your request for order ${refund.order?.orderNumber ?? 'reference'} cannot be approved: ${overrideReason}.`;

    const updated = await this.prisma.refundRequest.update({
      where: { id },
      data: {
        decision,
        decisionReason: `Human Override by ${operatorName}: ${overrideReason}`,
        customerReply,
        policyTrace: updatedPolicyTrace,
      },
      include: {
        customer: true,
        order: { include: { items: true } },
      },
    });

    this.logger.log(`[Override] Refund ${id} overridden to ${decision} by ${operatorName}`);
    return updated;
  }
}
