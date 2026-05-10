import { count, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getCurrentUserId } from '@/lib/auth/currentUser';
import { db } from '@/lib/db';
import { generationTasks } from '@/lib/db/schema';

export const runtime = 'nodejs';

const defaultLimit = 20;
const maxLimit = 50;

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = toPositiveInt(url.searchParams.get('page'), 1);
  const limit = Math.min(toPositiveInt(url.searchParams.get('limit'), defaultLimit), maxLimit);
  const offset = (page - 1) * limit;

  const [totalRow] = await db
    .select({
      total: count(),
    })
    .from(generationTasks)
    .where(eq(generationTasks.userId, userId));
  const tasks = await db
    .select({
      id: generationTasks.id,
      prompt: generationTasks.prompt,
      negativePrompt: generationTasks.negativePrompt,
      status: generationTasks.status,
      params: generationTasks.params,
      imageUrl: generationTasks.imageUrl,
      thumbnailUrl: generationTasks.thumbnailUrl,
      creditsCost: generationTasks.creditsCost,
      errorMessage: generationTasks.errorMessage,
      createdAt: generationTasks.createdAt,
      completedAt: generationTasks.completedAt,
    })
    .from(generationTasks)
    .where(eq(generationTasks.userId, userId))
    .orderBy(desc(generationTasks.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    tasks,
    total: totalRow?.total ?? 0,
    page,
    limit,
  });
}

function toPositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}
