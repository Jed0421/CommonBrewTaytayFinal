import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, fullName?: string) {
  const result = await db.insert(users)
    .values({
      id: `usr-${uid.substring(0, 16)}`,
      uid,
      email,
      fullName: fullName || email.split('@')[0],
      username: email.split('@')[0],
      role: 'Customer',
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email,
        ...(fullName ? { fullName } : {})
      },
    })
    .returning();

  return result[0];
}
