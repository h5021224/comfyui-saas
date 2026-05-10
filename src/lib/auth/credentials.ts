import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { assertDatabaseUrl, db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const credentialsSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
});

export async function verifyCredentials(credentials: unknown) {
  const parsedCredentials = credentialsSchema.safeParse(credentials);

  if (!parsedCredentials.success) {
    return null;
  }

  assertDatabaseUrl();

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      name: users.name,
      role: users.role,
      credits: users.credits,
    })
    .from(users)
    .where(eq(users.email, parsedCredentials.data.email))
    .limit(1);

  if (!user) {
    return null;
  }

  const passwordsMatch = await compare(parsedCredentials.data.password, user.passwordHash);

  if (!passwordsMatch) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    credits: user.credits,
  };
}
