import { db } from './src/lib/db';
import { orders } from './src/lib/schema';
import { eq, and } from 'drizzle-orm';

async function check() {
  const allOrders = await db.select().from(orders);
  console.log(JSON.stringify(allOrders.filter(o => o.orderType === 'doctor'), null, 2));
}

check().catch(console.error);
