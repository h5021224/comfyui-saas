import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getCurrentUserId } from '@/lib/auth/currentUser';
import { db } from '@/lib/db';
import { generationTasks } from '@/lib/db/schema';
import { getLatestTaskEvent, progressForStatus } from '@/lib/generate/events';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = await getCurrentUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await context.params;
  const [task] = await db
    .select()
    .from(generationTasks)
    .where(and(eq(generationTasks.id, taskId), eq(generationTasks.userId, userId)))
    .limit(1);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const latestEvent = getLatestTaskEvent(task.id);

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
    progress: latestEvent?.progress ?? progressForStatus(task.status),
    prompt: task.prompt,
    negativePrompt: task.negativePrompt,
    params: task.params,
    creditsCost: task.creditsCost,
    imageUrl: task.imageUrl,
    thumbnailUrl: task.thumbnailUrl,
    comfyuiPromptId: task.comfyuiPromptId,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
  });
}
