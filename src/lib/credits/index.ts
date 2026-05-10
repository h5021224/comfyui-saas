import { desc, eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import { creditTransactions, users, type CreditTransaction } from '@/lib/db/schema';

export class InsufficientCreditsError extends Error {
  constructor(
    public readonly creditsNeeded: number,
    public readonly creditsAvailable: number,
  ) {
    super('Insufficient credits');
  }
}

type CreditTransactionType = 'purchase' | 'consume' | 'refund' | 'gift';

type CreditChangeOptions = {
  referenceId?: string;
  description?: string;
};

type CreditCostParams = {
  width: number;
  height: number;
  steps: number;
};

export function calculateCreditsCost({ width, height, steps }: CreditCostParams) {
  const baseArea = 512 * 512;
  const sizeMultiplier = Math.max(1, Math.ceil(Math.sqrt((width * height) / baseArea)));
  const stepSurcharge = steps > 30 ? 1 : 0;

  return sizeMultiplier + stepSurcharge;
}

export async function getBalance(userId: string) {
  const [user] = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return null;
  }

  const transactions = await db
    .select({
      id: creditTransactions.id,
      amount: creditTransactions.amount,
      type: creditTransactions.type,
      balanceAfter: creditTransactions.balanceAfter,
      referenceId: creditTransactions.referenceId,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(20);

  return {
    credits: user.credits,
    transactions,
  };
}

export async function deductCredits(userId: string, cost: number, referenceId: string, description?: string) {
  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update').limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    if (user.credits < cost) {
      throw new InsufficientCreditsError(cost, user.credits);
    }

    const newBalance = user.credits - cost;

    await tx.update(users).set({ credits: newBalance, updatedAt: new Date() }).where(eq(users.id, userId));
    await tx.insert(creditTransactions).values({
      userId,
      amount: -cost,
      type: 'consume',
      balanceAfter: newBalance,
      referenceId,
      description: description ?? `消费 ${cost} 积分`,
    });

    return newBalance;
  });
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options: CreditChangeOptions = {},
) {
  return changeCredits(userId, amount, type, options);
}

export async function refundCredits(userId: string, amount: number, referenceId: string) {
  return changeCredits(userId, amount, 'refund', {
    referenceId,
    description: `退还 ${amount} 积分`,
  });
}

async function changeCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  options: CreditChangeOptions,
) {
  if (amount <= 0) {
    throw new Error('Credit amount must be positive');
  }

  return db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update').limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const newBalance = user.credits + amount;
    const [transaction] = await tx
      .insert(creditTransactions)
      .values({
        userId,
        amount,
        type,
        balanceAfter: newBalance,
        referenceId: options.referenceId,
        description: options.description ?? `增加 ${amount} 积分`,
      })
      .returning();

    await tx.update(users).set({ credits: newBalance, updatedAt: new Date() }).where(eq(users.id, userId));

    return {
      balance: newBalance,
      transaction: transaction as CreditTransaction,
    };
  });
}
