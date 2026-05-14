import { eq } from 'drizzle-orm';

import { getHistory, getImage, getProgress, queuePrompt } from '@/lib/comfyui/client';
import { buildTxt2ImgWorkflow } from '@/lib/comfyui/workflow';
import { refundCredits } from '@/lib/credits';
import { db } from '@/lib/db';
import { generationTasks } from '@/lib/db/schema';
import { publishTaskEvent } from '@/lib/generate/events';
import type { GenerateRequest } from '@/lib/generate/validation';
import { uploadImageToR2 } from '@/lib/r2/upload';
import type { ComfyImageRef } from '@/types/comfyui';

type ProcessGenerationTaskParams = {
  taskId: string;
  userId: string;
  input: GenerateRequest;
  creditsCost: number;
};

export async function processGenerationTask({ taskId, userId, input, creditsCost }: ProcessGenerationTaskParams) {
  try {
    await updateTaskProcessing(taskId);
    publishTaskEvent({
      taskId,
      status: 'processing',
      progress: 5,
      message: 'Task submitted to ComfyUI',
    });

    const workflow = buildTxt2ImgWorkflow(input);
    const queued = await queuePrompt(workflow);

    await db
      .update(generationTasks)
      .set({
        comfyuiPromptId: queued.promptId,
      })
      .where(eq(generationTasks.id, taskId));

    publishTaskEvent({
      taskId,
      status: 'processing',
      progress: 10,
      message: 'ComfyUI generation started',
    });

    for await (const event of getProgress(queued.promptId, queued.clientId)) {
      if (event.type === 'progress') {
        publishTaskEvent({
          taskId,
          status: 'processing',
          progress: Math.min(95, Math.max(10, event.percent)),
          message: `Sampling ${event.value}/${event.max}`,
        });
      }

      if (event.type === 'complete') {
        publishTaskEvent({
          taskId,
          status: 'processing',
          progress: 96,
          message: 'Uploading image',
        });
      }
    }

    const imageRef = extractOutputImage(await getHistory(queued.promptId));
    const imageBytes = await getImage(imageRef);
    const imageUrl = await uploadImageToR2({
      bytes: imageBytes,
      key: `generations/${userId}/${taskId}.png`,
      contentType: 'image/png',
    });

    await db
      .update(generationTasks)
      .set({
        status: 'completed',
        imageUrl,
        thumbnailUrl: imageUrl,
        completedAt: new Date(),
      })
      .where(eq(generationTasks.id, taskId));

    publishTaskEvent({
      taskId,
      status: 'completed',
      progress: 100,
      message: 'Generation completed',
      imageUrl,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    console.error('Generation task failed', {
      taskId,
      userId,
      error,
    });

    await db
      .update(generationTasks)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(generationTasks.id, taskId));

    await refundCredits(userId, creditsCost, taskId).catch((refundError) => {
      console.error('Failed to refund credits after generation failure', refundError);
    });

    publishTaskEvent({
      taskId,
      status: 'failed',
      progress: 100,
      message: 'Generation failed',
      errorMessage,
    });
  }
}

async function updateTaskProcessing(taskId: string) {
  await db
    .update(generationTasks)
    .set({
      status: 'processing',
      startedAt: new Date(),
    })
    .where(eq(generationTasks.id, taskId));
}

function extractOutputImage(history: Record<string, unknown>): ComfyImageRef {
  for (const item of Object.values(history)) {
    if (!isRecord(item)) {
      continue;
    }

    const outputs = item.outputs;

    if (!isRecord(outputs)) {
      continue;
    }

    const outputImage = findImageInOutputs(outputs, 'output') ?? findImageInOutputs(outputs);

    if (outputImage) {
      return outputImage;
    }
  }

  throw new Error('ComfyUI history did not include an output image');
}

function findImageInOutputs(outputs: Record<string, unknown>, preferredType?: ComfyImageRef['type']) {
  for (const output of Object.values(outputs)) {
    if (!isRecord(output) || !Array.isArray(output.images)) {
      continue;
    }

    const image = output.images.find((candidate) => {
      if (!isImageRef(candidate)) {
        return false;
      }

      return preferredType ? candidate.type === preferredType : true;
    });

    if (isImageRef(image)) {
      return image;
    }
  }

  return null;
}

function isImageRef(value: unknown): value is ComfyImageRef {
  if (!isRecord(value) || typeof value.filename !== 'string') {
    return false;
  }

  const type = value.type;

  return type === undefined || type === 'input' || type === 'output' || type === 'temp';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
