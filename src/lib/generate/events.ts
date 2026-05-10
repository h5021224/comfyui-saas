import type { GenerationTask } from '@/lib/db/schema';

export type GenerateTaskStatus = GenerationTask['status'];

export type GenerateTaskEvent = {
  taskId: string;
  status: GenerateTaskStatus;
  progress: number;
  message?: string;
  imageUrl?: string | null;
  errorMessage?: string | null;
  updatedAt: string;
};

type Listener = (event: GenerateTaskEvent) => void;

const latestEvents = new Map<string, GenerateTaskEvent>();
const listeners = new Map<string, Set<Listener>>();

export function publishTaskEvent(event: Omit<GenerateTaskEvent, 'updatedAt'> & { updatedAt?: string }) {
  const nextEvent = {
    ...event,
    updatedAt: event.updatedAt ?? new Date().toISOString(),
  };
  latestEvents.set(event.taskId, nextEvent);
  listeners.get(event.taskId)?.forEach((listener) => listener(nextEvent));
}

export function getLatestTaskEvent(taskId: string) {
  return latestEvents.get(taskId) ?? null;
}

export function subscribeTaskEvents(taskId: string, listener: Listener) {
  const taskListeners = listeners.get(taskId) ?? new Set<Listener>();
  taskListeners.add(listener);
  listeners.set(taskId, taskListeners);

  return () => {
    taskListeners.delete(listener);

    if (taskListeners.size === 0) {
      listeners.delete(taskId);
    }
  };
}

export function progressForStatus(status: GenerateTaskStatus) {
  if (status === 'completed') {
    return 100;
  }

  if (status === 'failed') {
    return 100;
  }

  if (status === 'processing') {
    return 10;
  }

  return 0;
}
