export type ComfyWorkflow = Record<string, ComfyWorkflowNode>;

export type ComfyWorkflowNode = {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: {
    title?: string;
  };
};

export type QueuePromptResponse = {
  prompt_id: string;
  number: number;
  node_errors?: Record<string, unknown>;
};

export type QueuePromptResult = {
  promptId: string;
  queueNumber: number;
  clientId: string;
};

export type ComfyImageRef = {
  filename: string;
  subfolder?: string;
  type?: 'input' | 'output' | 'temp';
};

export type ComfyProgressEvent =
  | {
      type: 'status';
      queueRemaining?: number;
      raw: unknown;
    }
  | {
      type: 'execution_start';
      promptId: string;
      raw: unknown;
    }
  | {
      type: 'executing';
      promptId: string;
      node: string | null;
      raw: unknown;
    }
  | {
      type: 'progress';
      promptId?: string;
      value: number;
      max: number;
      percent: number;
      raw: unknown;
    }
  | {
      type: 'complete';
      promptId: string;
      raw: unknown;
    };
