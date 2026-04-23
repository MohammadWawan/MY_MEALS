import { db } from './src/lib/db';
import { surgerySchedules } from './src/lib/schema';

async function check() {
  const allSchedules = await db.select().from(surgerySchedules);
  console.log(JSON.stringify(allSchedules, null, 2));
}

check().catch(console.error);
