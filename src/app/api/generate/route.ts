import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { eq } from 'drizzle-orm';

import { getCurrentUserId } from '@/lib/auth/currentUser';
import { InsufficientCreditsError, calculateCreditsCost, deductCredits } from '@/lib/credits';
import { db } from '@/lib/db';
import { generationTasks } from '@/lib/db/schema';
import { assertPromptAllowed, UnsafePromptError } from '@/lib/generate/contentSafety';
import { publishTaskEvent } from '@/lib/generate/events';
import { processGenerationTask } from '@/lib/generate/processor';
import { checkGenerationRateLimit } from '@/lib/generate/rateLimit';
import { generateRequestSchema } from '@/lib/generate/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const userId = await getCurrentUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rateLimit = checkGenerationRateLimit(userId);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many generation requests',
          retryAfter: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
          },
        },
      );
    }

    const input = generateRequestSchema.parse(await request.json());
    assertPromptAllowed(input);

    const creditsCost = calculateCreditsCost(input);
    const [task] = await db
      .insert(generationTasks)
      .values({
        userId,
        status: 'queued',
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        params: input,
        creditsCost,
      })
      .returning({ id: generationTasks.id });

    let creditsRemaining: number;

    try {
      creditsRemaining = await deductCredits(userId, creditsCost, task.id, `Generate image (${creditsCost} credits)`);
    } catch (error) {
      await db.delete(generationTasks).where(eq(generationTasks.id, task.id));
      throw error;
    }

    publishTaskEvent({
      taskId: task.id,
      status: 'queued',
      progress: 0,
      message: 'Task queued',
    });
    void processGenerationTask({
      taskId: task.id,
      userId,
      input,
      creditsCost,
    });

    return NextResponse.json(
      {
        taskId: task.id,
        status: 'queued',
        creditsCost,
        creditsRemaining,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.flatten() }, { status: 400 });
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          creditsNeeded: error.creditsNeeded,
          creditsAvailable: error.creditsAvailable,
        },
        { status: 402 },
      );
    }

    if (error instanceof UnsafePromptError) {
      return NextResponse.json(
        {
          error: 'Prompt contains disallowed content',
          code: error.code,
          reason: error.reason,
        },
        { status: 400 },
      );
    }

    console.error('Failed to create generation task', error);

    return NextResponse.json({ error: 'Failed to create generation task' }, { status: 500 });
  }
}
