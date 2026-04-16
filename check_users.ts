import { db } from "./src/lib/db";
import { users } from "./src/lib/schema";

async function check() {
  const allUsers = await db.select().from(users);
  console.log(JSON.stringify(allUsers, null, 2));
  process.exit(0);
}
check();
