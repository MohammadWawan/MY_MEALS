import { db } from './src/lib/db';
import { orders } from './src/lib/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

async function check() {
  const targetDate = new Date("2026-04-22T17:00:00Z"); // Start of 23rd WIB
  const nextDate = new Date("2026-04-23T17:00:00Z"); // Start of 24th WIB
  
  const results = await db.query.orders.findMany({
    where: and(
      eq(orders.userId, 7),
      eq(orders.orderType, 'doctor'),
      gte(orders.expectedDate, targetDate),
      lt(orders.expectedDate, nextDate)
    ),
    with: { orderItems: true }
  });
  console.log(JSON.stringify(results, null, 2));
}

check().catch(console.error);
