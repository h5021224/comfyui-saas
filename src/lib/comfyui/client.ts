import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

import type {
  ComfyImageRef,
  ComfyProgressEvent,
  ComfyWorkflow,
  QueuePromptResponse,
  QueuePromptResult,
} from '@/types/comfyui';

const defaultApiUrl = 'http://localhost:8188';

function getComfyApiUrl() {
  return (process.env.COMFYUI_API_URL ?? defaultApiUrl).replace(/\/$/, '');
}

function toWebSocketUrl(apiUrl: string, clientId: string) {
  const url = new URL(apiUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = new URLSearchParams({ clientId }).toString();

  return url.toString();
}

async function parseJsonResponse<T>(response: Response) {
  const data = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    throw new Error(`ComfyUI request failed: ${response.status}`);
  }

  if (!data) {
    throw new Error('ComfyUI returned an empty response');
  }

  return data;
}

export async function queuePrompt(workflow: ComfyWorkflow, clientId = randomUUID()): Promise<QueuePromptResult> {
  const response = await fetch(`${getComfyApiUrl()}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: workflow,
      client_id: clientId,
    }),
  });
  const data = await parseJsonResponse<QueuePromptResponse>(response);

  if (!data.prompt_id) {
    throw new Error('ComfyUI did not return prompt_id');
  }

  return {
    promptId: data.prompt_id,
    queueNumber: data.number,
    clientId,
  };
}

export async function getHistory(promptId: string) {
  const response = await fetch(`${getComfyApiUrl()}/history/${encodeURIComponent(promptId)}`);

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function getImage({ filename, subfolder = '', type = 'output' }: ComfyImageRef) {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type,
  });
  const response = await fetch(`${getComfyApiUrl()}/view?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`ComfyUI image request failed: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function checkHealth() {
  const response = await fetch(`${getComfyApiUrl()}/system_stats`, {
    cache: 'no-store',
  }).catch(() => null);

  if (response?.ok) {
    return true;
  }

  const rootResponse = await fetch(getComfyApiUrl(), {
    cache: 'no-store',
  }).catch(() => null);

  return rootResponse?.ok ?? false;
}

export async function* getProgress(promptId: string, clientId: string): AsyncGenerator<ComfyProgressEvent> {
  const socket = new WebSocket(toWebSocketUrl(getComfyApiUrl(), clientId));
  const pendingMessages: ComfyProgressEvent[] = [];
  const pendingResolvers: Array<() => void> = [];
  let socketError: Error | null = null;
  let socketClosed = false;

  const wake = () => pendingResolvers.shift()?.();
  const waitForMessage = () =>
    new Promise<void>((resolve) => {
      pendingResolvers.push(resolve);
    });

  socket.on('message', (message) => {
    const event = toProgressEvent(message.toString(), promptId);

    if (event) {
      pendingMessages.push(event);
      wake();
    }
  });
  socket.on('error', (error) => {
    socketError = error instanceof Error ? error : new Error(String(error));
    wake();
  });
  socket.on('close', () => {
    socketClosed = true;
    wake();
  });

  try {
    while (!socketClosed || pendingMessages.length > 0) {
      const event = pendingMessages.shift();

      if (event) {
        yield event;

        if (event.type === 'complete') {
          return;
        }

        continue;
      }

      if (socketError) {
        throw socketError;
      }

      await waitForMessage();
    }
  } finally {
    socket.close();
  }
}

function toProgressEvent(rawMessage: string, targetPromptId: string): ComfyProgressEvent | null {
  if (!rawMessage.trimStart().startsWith('{')) {
    return null;
  }

  const message = JSON.parse(rawMessage) as {
    type?: string;
    data?: Record<string, unknown>;
  };
  const data = message.data ?? {};
  const promptId = typeof data.prompt_id === 'string' ? data.prompt_id : undefined;

  if (promptId && promptId !== targetPromptId) {
    return null;
  }

  if (message.type === 'status') {
    const execInfo = data.exec_info as { queue_remaining?: number } | undefined;

    return {
      type: 'status',
      queueRemaining: execInfo?.queue_remaining,
      raw: message,
    };
  }

  if (message.type === 'execution_start' && promptId) {
    return {
      type: 'execution_start',
      promptId,
      raw: message,
    };
  }

  if (message.type === 'executing' && promptId) {
    const node = typeof data.node === 'string' ? data.node : null;

    if (node === null) {
      return {
        type: 'complete',
        promptId,
        raw: message,
      };
    }

    return {
      type: 'executing',
      promptId,
      node,
      raw: message,
    };
  }

  if (message.type === 'progress') {
    const value = typeof data.value === 'number' ? data.value : 0;
    const max = typeof data.max === 'number' ? data.max : 1;

    return {
      type: 'progress',
      promptId,
      value,
      max,
      percent: Math.round((value / max) * 100),
      raw: message,
    };
  }

  return null;
}
