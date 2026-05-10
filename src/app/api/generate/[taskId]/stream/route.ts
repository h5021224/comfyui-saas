import { and, eq } from 'drizzle-orm';

import { getCurrentUserId } from '@/lib/auth/currentUser';
import { db } from '@/lib/db';
import { generationTasks } from '@/lib/db/schema';
import { getLatestTaskEvent, progressForStatus, subscribeTaskEvents } from '@/lib/generate/events';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const userId = await getCurrentUserId(request);

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { taskId } = await context.params;
  const [task] = await db
    .select()
    .from(generationTasks)
    .where(and(eq(generationTasks.id, taskId), eq(generationTasks.userId, userId)))
    .limit(1);

  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const unsubscribe = subscribeTaskEvents(taskId, send);
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 15000);

      send(
        getLatestTaskEvent(taskId) ?? {
          taskId,
          status: task.status,
          progress: progressForStatus(task.status),
          imageUrl: task.imageUrl,
          errorMessage: task.errorMessage,
          updatedAt: new Date().toISOString(),
        },
      );

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
