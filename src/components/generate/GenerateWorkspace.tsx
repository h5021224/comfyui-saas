'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Download, ImageIcon, Loader2, Play, RotateCcw, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type TaskStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

type GenerateFormState = {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  steps: number;
  cfg: number;
  sampler: string;
  seed: number;
};

type GenerateResponse = {
  taskId: string;
  status: 'queued';
  creditsCost: number;
  creditsRemaining: number;
};

type TaskEvent = {
  taskId: string;
  status: Exclude<TaskStatus, 'idle'>;
  progress: number;
  message?: string;
  imageUrl?: string | null;
  errorMessage?: string | null;
};

type CreditsResponse = {
  credits: number;
};

const copy = {
  title: '\u6587\u751f\u56fe',
  subtitle:
    '\u8f93\u5165 prompt\uff0c\u8bbe\u7f6e\u5c3a\u5bf8\u3001\u6b65\u6570\u548c\u91c7\u6837\u5668\uff0c\u7136\u540e\u63d0\u4ea4\u5230\u672c\u5730 ComfyUI\u3002',
  prompt: 'Prompt',
  negativePrompt: 'Negative prompt',
  promptPlaceholder:
    '\u4f8b\u5982\uff1aa cinematic watercolor landscape, morning light, detailed, soft colors',
  negativePlaceholder: '\u4f8b\u5982\uff1ablurry, low quality, distorted',
  parameters: '\u53c2\u6570',
  size: '\u5c3a\u5bf8',
  steps: '\u6b65\u6570',
  cfg: 'CFG',
  sampler: '\u91c7\u6837\u5668',
  seed: '\u79cd\u5b50',
  randomSeed: '-1 \u8868\u793a\u968f\u673a',
  submit: '\u5f00\u59cb\u751f\u6210',
  generating: '\u751f\u6210\u4e2d',
  reset: '\u91cd\u7f6e',
  result: '\u751f\u6210\u7ed3\u679c',
  waiting: '\u7b49\u5f85\u63d0\u4ea4\u751f\u6210\u4efb\u52a1',
  download: '\u4e0b\u8f7d',
  noCredits: '\u79ef\u5206\u4e0d\u8db3',
  failed: '\u751f\u6210\u5931\u8d25',
  completed: '\u751f\u6210\u5b8c\u6210',
  queued: '\u5df2\u52a0\u5165\u961f\u5217',
  processing: '\u6b63\u5728\u5904\u7406',
  cost: '\u9884\u8ba1\u6d88\u8017',
  balance: '\u5f53\u524d\u4f59\u989d',
  offline: 'ComfyUI \u6216\u4e0a\u4f20\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528',
};

const initialForm: GenerateFormState = {
  prompt: '',
  negativePrompt: '',
  width: 512,
  height: 512,
  steps: 20,
  cfg: 7,
  sampler: 'euler',
  seed: -1,
};

const sizes = [
  [512, 512],
  [768, 768],
  [1024, 1024],
  [768, 1024],
  [1024, 768],
] as const;

const samplers = ['euler', 'euler_ancestral', 'dpmpp_2m', 'dpmpp_sde', 'ddim'];

export function GenerateWorkspace() {
  const [form, setForm] = useState<GenerateFormState>(initialForm);
  const [status, setStatus] = useState<TaskStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(copy.waiting);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const creditsCost = useMemo(
    () => calculateCreditsCost({ width: form.width, height: form.height, steps: form.steps }),
    [form.height, form.steps, form.width],
  );
  const isRunning = status === 'queued' || status === 'processing';
  const canSubmit = form.prompt.trim().length > 0 && !isRunning;

  useEffect(() => {
    void refreshCredits();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  async function refreshCredits() {
    const response = await fetch('/api/credits', {
      cache: 'no-store',
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as CreditsResponse;
    setCredits(data.credits);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    eventSourceRef.current?.close();
    setStatus('queued');
    setProgress(0);
    setMessage(copy.queued);
    setTaskId(null);
    setImageUrl(null);
    setErrorMessage(null);

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      await handleSubmitError(response);
      return;
    }

    const data = (await response.json()) as GenerateResponse;

    setTaskId(data.taskId);
    setCredits(data.creditsRemaining);
    connectTaskStream(data.taskId);
  }

  async function handleSubmitError(response: Response) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string; creditsNeeded?: number; creditsAvailable?: number }
      | null;

    setStatus('failed');
    setProgress(100);

    if (response.status === 402) {
      setErrorMessage(`${copy.noCredits}: ${data?.creditsAvailable ?? 0}/${data?.creditsNeeded ?? creditsCost}`);
      setMessage(copy.noCredits);
      return;
    }

    setErrorMessage(data?.error ?? copy.offline);
    setMessage(copy.failed);
  }

  function connectTaskStream(nextTaskId: string) {
    const eventSource = new EventSource(`/api/generate/${nextTaskId}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as TaskEvent;

      setStatus(data.status);
      setProgress(data.progress);
      setMessage(data.message ?? statusLabel(data.status));
      setImageUrl(data.imageUrl ?? null);
      setErrorMessage(data.errorMessage ?? null);

      if (data.status === 'completed' || data.status === 'failed') {
        eventSource.close();
        void refreshCredits();
        void refreshTask(nextTaskId);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      void refreshTask(nextTaskId);
    };
  }

  async function refreshTask(nextTaskId: string) {
    const response = await fetch(`/api/generate/${nextTaskId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as TaskEvent;

    setStatus(data.status);
    setProgress(data.progress);
    setImageUrl(data.imageUrl ?? null);
    setErrorMessage(data.errorMessage ?? null);
    setMessage(data.errorMessage ? copy.failed : statusLabel(data.status));
  }

  function resetForm() {
    if (isRunning) {
      return;
    }

    setForm(initialForm);
    setStatus('idle');
    setProgress(0);
    setMessage(copy.waiting);
    setTaskId(null);
    setImageUrl(null);
    setErrorMessage(null);
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
            {copy.cost}: {creditsCost}
          </Badge>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
            {copy.balance}: {credits ?? '-'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(20rem,0.92fr)_minmax(0,1.08fr)]">
        <form onSubmit={handleSubmit} className="rounded-md border bg-card p-5">
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium">{copy.prompt}</span>
              <textarea
                value={form.prompt}
                onChange={(event) => setForm((current) => ({ ...current, prompt: event.target.value }))}
                placeholder={copy.promptPlaceholder}
                className="mt-2 min-h-36 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring"
                maxLength={2000}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">{copy.negativePrompt}</span>
              <textarea
                value={form.negativePrompt}
                onChange={(event) => setForm((current) => ({ ...current, negativePrompt: event.target.value }))}
                placeholder={copy.negativePlaceholder}
                className="mt-2 min-h-24 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background transition focus:ring-2 focus:ring-ring"
                maxLength={2000}
              />
            </label>

            <div className="space-y-3">
              <h2 className="text-sm font-medium">{copy.parameters}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs text-muted-foreground">{copy.size}</span>
                  <select
                    value={`${form.width}x${form.height}`}
                    onChange={(event) => {
                      const [width, height] = event.target.value.split('x').map(Number);
                      setForm((current) => ({ ...current, width, height }));
                    }}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {sizes.map(([width, height]) => (
                      <option key={`${width}x${height}`} value={`${width}x${height}`}>
                        {width} x {height}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-muted-foreground">{copy.sampler}</span>
                  <select
                    value={form.sampler}
                    onChange={(event) => setForm((current) => ({ ...current, sampler: event.target.value }))}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {samplers.map((sampler) => (
                      <option key={sampler} value={sampler}>
                        {sampler}
                      </option>
                    ))}
                  </select>
                </label>

                <NumberField
                  label={copy.steps}
                  min={1}
                  max={50}
                  value={form.steps}
                  onChange={(steps) => setForm((current) => ({ ...current, steps }))}
                />
                <NumberField
                  label={copy.cfg}
                  min={1}
                  max={20}
                  step={0.5}
                  value={form.cfg}
                  onChange={(cfg) => setForm((current) => ({ ...current, cfg }))}
                />
              </div>

              <label className="block">
                <span className="text-xs text-muted-foreground">{copy.seed}</span>
                <input
                  value={form.seed}
                  onChange={(event) => setForm((current) => ({ ...current, seed: Number(event.target.value) }))}
                  type="number"
                  min={-1}
                  className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="mt-1 block text-xs text-muted-foreground">{copy.randomSeed}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="submit" disabled={!canSubmit} className="gap-2">
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {isRunning ? copy.generating : copy.submit}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isRunning} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {copy.reset}
              </Button>
            </div>
          </div>
        </form>

        <div className="rounded-md border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium">{copy.result}</h2>
            <StatusBadge status={status} />
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{message}</span>
            <span>{progress}%</span>
          </div>

          <div className="mt-5 flex min-h-[28rem] items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/30">
            {imageUrl ? (
              <div className="flex h-full w-full flex-col">
                <div
                  className="min-h-[24rem] flex-1 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  aria-label={copy.completed}
                />
                <div className="border-t bg-background p-3">
                  <Button asChild size="sm" className="gap-2">
                    <a href={imageUrl} download target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      {copy.download}
                    </a>
                  </Button>
                </div>
              </div>
            ) : errorMessage ? (
              <div className="max-w-md space-y-3 px-6 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
                <p className="text-sm font-medium">{copy.failed}</p>
                <p className="break-words text-sm leading-6 text-muted-foreground">{errorMessage}</p>
              </div>
            ) : isRunning ? (
              <div className="space-y-3 text-center">
                <Sparkles className="mx-auto h-10 w-10 animate-pulse text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{copy.waiting}</p>
              </div>
            )}
          </div>

          {taskId ? <p className="mt-3 break-all text-xs text-muted-foreground">Task ID: {taskId}</p> : null}
        </div>
      </div>
    </section>
  );
}

type NumberFieldProps = {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
};

function NumberField({ label, min, max, step = 1, value, onChange }: NumberFieldProps) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {label}
        <span>{value}</span>
      </span>
      <input
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        type="range"
        min={min}
        max={max}
        step={step}
        className="mt-3 w-full accent-foreground"
      />
    </label>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  if (status === 'completed') {
    return <Badge>{copy.completed}</Badge>;
  }

  if (status === 'failed') {
    return <Badge variant="destructive">{copy.failed}</Badge>;
  }

  if (status === 'queued') {
    return <Badge variant="secondary">{copy.queued}</Badge>;
  }

  if (status === 'processing') {
    return <Badge variant="secondary">{copy.processing}</Badge>;
  }

  return <Badge variant="outline">Idle</Badge>;
}

function statusLabel(status: Exclude<TaskStatus, 'idle'>) {
  if (status === 'completed') {
    return copy.completed;
  }

  if (status === 'failed') {
    return copy.failed;
  }

  if (status === 'queued') {
    return copy.queued;
  }

  return copy.processing;
}

function calculateCreditsCost({ width, height, steps }: { width: number; height: number; steps: number }) {
  const baseArea = 512 * 512;
  const sizeMultiplier = Math.max(1, Math.ceil(Math.sqrt((width * height) / baseArea)));
  const stepSurcharge = steps > 30 ? 1 : 0;

  return sizeMultiplier + stepSurcharge;
}
