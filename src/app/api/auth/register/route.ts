import { hash } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { assertDatabaseUrl, db } from '@/lib/db';
import { creditTransactions, users } from '@/lib/db/schema';

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(100).optional(),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    assertDatabaseUrl();
  } catch {
    return NextResponse.json(
      {
        error: 'database_not_configured',
        message: '数据库连接未配置',
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: 'invalid_params',
        message: '注册参数无效',
      },
      { status: 400 },
    );
  }

  const { email, password, name } = parsedBody.data;
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);

  if (existingUser) {
    return NextResponse.json(
      {
        error: 'email_exists',
        message: '该邮箱已注册',
      },
      { status: 409 },
    );
  }

  const passwordHash = await hash(password, 12);

  const user = await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        credits: 5,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        credits: users.credits,
      });

    await tx.insert(creditTransactions).values({
      userId: createdUser.id,
      amount: 5,
      type: 'gift',
      balanceAfter: 5,
      referenceId: createdUser.id,
      description: '新用户注册赠送积分',
    });

    return createdUser;
  });

  return NextResponse.json({ user }, { status: 201 });
}
