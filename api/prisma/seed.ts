import { PrismaClient, Tier, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Anchor time for seeded dates (relative to 2026-09-20)
const now = new Date('2026-09-20T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

export const SEED_CUSTOMERS = [
  // 1: Standard damage claim ($80, delivered 5 days ago) -> APPROVED
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000001',
      orderNumber: 'WN-10001',
      totalAmount: 80.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(5),
      placedAt: daysAgo(8),
      items: [{ name: 'Wireless Bluetooth Earbuds', quantity: 1, unitPrice: 80.0 }],
    },
  },
  // 2: Standard wrong item claim ($120, delivered 5 days ago) -> APPROVED
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000002',
      orderNumber: 'WN-10002',
      totalAmount: 120.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(5),
      placedAt: daysAgo(10),
      items: [{ name: 'Mechanical Keyboard (Tactile)', quantity: 1, unitPrice: 120.0 }],
    },
  },
  // 3: Final sale item, damaged -> ESCALATED (RP-002)
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Charlie Davis',
    email: 'charlie.davis@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000003',
      orderNumber: 'WN-10003',
      totalAmount: 65.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: true,
      deliveredAt: daysAgo(4),
      placedAt: daysAgo(7),
      items: [{ name: 'Clearance Denim Jacket', quantity: 1, unitPrice: 65.0 }],
    },
  },
  // 4: Final sale, changed mind -> DENIED (RP-001)
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000004',
      orderNumber: 'WN-10004',
      totalAmount: 95.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: true,
      deliveredAt: daysAgo(12),
      placedAt: daysAgo(15),
      items: [{ name: 'Final Sale Silk Scarf', quantity: 1, unitPrice: 95.0 }],
    },
  },
  // 5: Delivered 90 days ago -> DENIED (outside 30-day window, RP-003)
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Evan Wright',
    email: 'evan.wright@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000005',
      orderNumber: 'WN-10005',
      totalAmount: 140.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(90),
      placedAt: daysAgo(95),
      items: [{ name: 'Waterproof Hiking Boots', quantity: 1, unitPrice: 140.0 }],
    },
  },
  // 6: Delivered 29 days ago (boundary) -> APPROVED
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    name: 'Fiona Gallagher',
    email: 'fiona.gallagher@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000006',
      orderNumber: 'WN-10006',
      totalAmount: 150.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(29),
      placedAt: daysAgo(33),
      items: [{ name: 'Ceramic Table Lamp', quantity: 1, unitPrice: 150.0 }],
    },
  },
  // 7: Delivered 31 days ago (boundary) -> DENIED (RP-003)
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    name: 'George Clark',
    email: 'george.clark@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000007',
      orderNumber: 'WN-10007',
      totalAmount: 150.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(31),
      placedAt: daysAgo(35),
      items: [{ name: 'Adjustable Office Chair', quantity: 1, unitPrice: 150.0 }],
    },
  },
  // 8: $501 damaged (boundary) -> ESCALATED (RP-004)
  {
    id: 'c1000000-0000-0000-0000-000000000008',
    name: 'Hannah Abbott',
    email: 'hannah.abbott@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000008',
      orderNumber: 'WN-10008',
      totalAmount: 501.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(6),
      placedAt: daysAgo(10),
      items: [{ name: 'Ultra HD 4K Monitor', quantity: 1, unitPrice: 501.0 }],
    },
  },
  // 9: $499 damaged (boundary) -> APPROVED
  {
    id: 'c1000000-0000-0000-0000-000000000009',
    name: 'Ian Malcolm',
    email: 'ian.malcolm@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000009',
      orderNumber: 'WN-10009',
      totalAmount: 499.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(6),
      placedAt: daysAgo(10),
      items: [{ name: 'Noise-Cancelling Over-Ear Headphones', quantity: 1, unitPrice: 499.0 }],
    },
  },
  // 10: Never arrived, status SHIPPED -> ESCALATED (RP-005)
  {
    id: 'c1000000-0000-0000-0000-000000000010',
    name: 'Julia Roberts',
    email: 'julia.roberts@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000010',
      orderNumber: 'WN-10010',
      totalAmount: 110.0,
      status: OrderStatus.SHIPPED,
      isFinalSale: false,
      deliveredAt: null,
      placedAt: daysAgo(14),
      items: [{ name: 'Espresso Coffee Grinder', quantity: 1, unitPrice: 110.0 }],
    },
  },
  // 11: Order CANCELLED already -> DENIED (RP-005)
  {
    id: 'c1000000-0000-0000-0000-000000000011',
    name: 'Kevin Bacon',
    email: 'kevin.bacon@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000011',
      orderNumber: 'WN-10011',
      totalAmount: 75.0,
      status: OrderStatus.CANCELLED,
      isFinalSale: false,
      deliveredAt: null,
      placedAt: daysAgo(20),
      items: [{ name: 'Cast Iron Dutch Oven', quantity: 1, unitPrice: 75.0 }],
    },
  },
  // 12: riskFlag: true, prior refunds -> ESCALATED (RP-006)
  {
    id: 'c1000000-0000-0000-0000-000000000012',
    name: 'Liam Neeson',
    email: 'liam.neeson@example.com',
    tier: Tier.STANDARD,
    riskFlag: true,
    order: {
      id: 'o1000000-0000-0000-0000-000000000012',
      orderNumber: 'WN-10012',
      totalAmount: 130.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(8),
      placedAt: daysAgo(12),
      items: [{ name: 'Portable SSD 2TB', quantity: 1, unitPrice: 130.0 }],
    },
  },
  // 13: Asks about order not owned -> DENIED (RP-007)
  {
    id: 'c1000000-0000-0000-0000-000000000013',
    name: 'Maya Lin',
    email: 'maya.lin@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000013',
      orderNumber: 'WN-10013',
      totalAmount: 60.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(10),
      placedAt: daysAgo(14),
      items: [{ name: 'Smart LED Lightstrip', quantity: 1, unitPrice: 60.0 }],
    },
  },
  // 14: Premium tier, 45 days, damaged -> ESCALATED (RP-009)
  {
    id: 'c1000000-0000-0000-0000-000000000014',
    name: 'Noah Centineo',
    email: 'noah.centineo@example.com',
    tier: Tier.PREMIUM,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000014',
      orderNumber: 'WN-10014',
      totalAmount: 220.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(45),
      placedAt: daysAgo(50),
      items: [{ name: 'Italian Leather Briefcase', quantity: 1, unitPrice: 220.0 }],
    },
  },
  // 15: Multi-item order, partial refund claim -> ESCALATED (RP-008)
  {
    id: 'c1000000-0000-0000-0000-000000000015',
    name: 'Olivia Wilde',
    email: 'olivia.wilde@example.com',
    tier: Tier.STANDARD,
    riskFlag: false,
    order: {
      id: 'o1000000-0000-0000-0000-000000000015',
      orderNumber: 'WN-10015',
      totalAmount: 280.0,
      status: OrderStatus.DELIVERED,
      isFinalSale: false,
      deliveredAt: daysAgo(7),
      placedAt: daysAgo(11),
      items: [
        { name: 'Ergonomic Desk Mat', quantity: 1, unitPrice: 40.0 },
        { name: 'Dual Monitor Arm Mount', quantity: 1, unitPrice: 160.0 },
        { name: 'USB-C Docking Station', quantity: 1, unitPrice: 80.0 },
      ],
    },
  },
];

export async function main() {
  console.log('Seeding 15 branch-testing customer fixtures idempotently...');

  for (const item of SEED_CUSTOMERS) {
    const customer = await prisma.customer.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        tier: item.tier,
        riskFlag: item.riskFlag,
      },
      create: {
        id: item.id,
        name: item.name,
        email: item.email,
        tier: item.tier,
        riskFlag: item.riskFlag,
      },
    });

    const order = await prisma.order.upsert({
      where: { orderNumber: item.order.orderNumber },
      update: {
        customerId: customer.id,
        totalAmount: item.order.totalAmount,
        status: item.order.status,
        isFinalSale: item.order.isFinalSale,
        deliveredAt: item.order.deliveredAt,
        placedAt: item.order.placedAt,
      },
      create: {
        id: item.order.id,
        orderNumber: item.order.orderNumber,
        customerId: customer.id,
        totalAmount: item.order.totalAmount,
        currency: 'USD',
        status: item.order.status,
        isFinalSale: item.order.isFinalSale,
        deliveredAt: item.order.deliveredAt,
        placedAt: item.order.placedAt,
      },
    });

    // Replace order items idempotently
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    for (const oi of item.order.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          name: oi.name,
          quantity: oi.quantity,
          unitPrice: oi.unitPrice,
        },
      });
    }
  }

  console.log('Successfully seeded 15 fixtures with zero duplicates.');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
