const { db } = require('./src/lib/db');
const { orders } = require('./src/lib/schema');
const { eq, and } = require('drizzle-orm');

async function check() {
  const allOrders = await db.select().from(orders);
  console.log(JSON.stringify(allOrders.filter(o => o.orderType === 'doctor'), null, 2));
}

check();
