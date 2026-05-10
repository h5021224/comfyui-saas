'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, Coins, Download, ImageIcon, Loader2, Maximize2, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type HistoryTaskStatus = 'queued' | 'processing' | 'completed' | 'failed';

type HistoryTask = {
  id: string;
  prompt: string;
  negativePrompt: string | null;
  status: HistoryTaskStatus;
  params: unknown;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  creditsCost: number;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

type HistoryResponse = {
  tasks: HistoryTask[];
  total: number;
  page: number;
  limit: number;
};

const copy = {
  title: '\u751f\u6210\u5386\u53f2',
  subtitle:
    '\u6309\u65f6\u95f4\u5012\u5e8f\u67e5\u770b\u4f60\u63d0\u4ea4\u8fc7\u7684\u751f\u56fe\u4efb\u52a1\uff0c\u5305\u542b\u56fe\u7247\u3001prompt\u3001\u53c2\u6570\u548c\u6d88\u8017\u79ef\u5206\u3002',
  emptyTitle: '\u6682\u65e0\u751f\u6210\u8bb0\u5f55',
  emptyBody: '\u53bb Generate \u9875\u9762\u63d0\u4ea4\u4e00\u6b21\u751f\u6210\uff0c\u8bb0\u5f55\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc\u3002',
  loadMore: '\u52a0\u8f7d\u66f4\u591a',
  refresh: '\u5237\u65b0',
  details: '\u67e5\u770b\u8be6\u60c5',
  prompt: 'Prompt',
  negativePrompt: 'Negative prompt',
  parameters: '\u53c2\u6570',
  error: '\u9519\u8bef',
  download: '\u4e0b\u8f7d',
  total: '\u5171',
  records: '\u6761\u8bb0\u5f55',
  imageMissing: '\u56fe\u7247\u672a\u751f\u6210\u6216 R2 \u672a\u914d\u7f6e',
  queued: '\u961f\u5217\u4e2d',
  processing: '\u5904\u7406\u4e2d',
  completed: '\u5df2\u5b8c\u6210',
  failed: '\u5931\u8d25',
};

const pageSize = 12;

export function HistoryGallery() {
  const [tasks, setTasks] = useState<HistoryTask[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<HistoryTask | null>(null);
  const hasMore = tasks.length < total;

  useEffect(() => {
    void loadPage(1, 'replace');
  }, []);

  async function loadPage(nextPage: number, mode: 'replace' | 'append') {
    if (mode === 'replace') {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    setErrorMessage(null);

    try {
      const response = await fetch(`/api/history?page=${nextPage}&limit=${pageSize}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`History request failed: ${response.status}`);
      }

      const data = (await response.json()) as HistoryResponse;

      setTasks((current) => (mode === 'replace' ? data.tasks : [...current, ...data.tasks]));
      setPage(data.page);
      setTotal(data.total);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  function refresh() {
    void loadPage(1, 'replace');
  }

  function loadMore() {
    if (!hasMore || isLoadingMore) {
      return;
    }

    void loadPage(page + 1, 'append');
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1.5">
            {copy.total} {total} {copy.records}
          </Badge>
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {copy.refresh}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 animate-pulse rounded-md border bg-muted/40" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <HistoryCard key={task.id} task={task} onSelect={() => setSelectedTask(task)} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" onClick={loadMore} disabled={isLoadingMore} className="gap-2">
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {copy.loadMore}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <TaskDialog task={selectedTask} onOpenChange={(isOpen) => !isOpen && setSelectedTask(null)} />
    </section>
  );
}

function HistoryCard({ task, onSelect }: { task: HistoryTask; onSelect: () => void }) {
  const imageUrl = task.thumbnailUrl ?? task.imageUrl;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-md border bg-card text-left transition hover:border-foreground/30"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {imageUrl ? (
          <div
            className="h-full w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
            <div className="space-y-3">
              {task.status === 'failed' ? (
                <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
              ) : (
                <ImageIcon className="mx-auto h-9 w-9" />
              )}
              <p>{copy.imageMissing}</p>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={task.status} />
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-background/90 p-1.5 opacity-0 shadow-sm transition group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-3 p-4">
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{task.prompt}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            {task.creditsCost}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(task.createdAt)}
          </span>
        </div>
      </div>
    </button>
  );
}

function TaskDialog({ task, onOpenChange }: { task: HistoryTask | null; onOpenChange: (isOpen: boolean) => void }) {
  const imageUrl = task?.imageUrl ?? task?.thumbnailUrl ?? null;
  const params = useMemo(() => formatParams(task?.params), [task?.params]);

  return (
    <Dialog open={Boolean(task)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0">
        {task ? (
          <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="min-h-[22rem] bg-muted">
              {imageUrl ? (
                <div className="min-h-[22rem] bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${imageUrl})` }} />
              ) : (
                <div className="flex min-h-[22rem] items-center justify-center p-8 text-center text-sm text-muted-foreground">
                  {copy.imageMissing}
                </div>
              )}
            </div>

            <div className="space-y-5 p-6">
              <DialogHeader>
                <div className="mb-2">
                  <StatusBadge status={task.status} />
                </div>
                <DialogTitle>{copy.details}</DialogTitle>
                <DialogDescription>{formatDate(task.createdAt)}</DialogDescription>
              </DialogHeader>

              <DetailBlock title={copy.prompt} value={task.prompt} />
              {task.negativePrompt ? <DetailBlock title={copy.negativePrompt} value={task.negativePrompt} /> : null}
              <DetailBlock title={copy.parameters} value={params} />
              {task.errorMessage ? <DetailBlock title={copy.error} value={task.errorMessage} destructive /> : null}

              {imageUrl ? (
                <Button asChild className="gap-2">
                  <a href={imageUrl} target="_blank" rel="noreferrer" download>
                    <Download className="h-4 w-4" />
                    {copy.download}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({ title, value, destructive = false }: { title: string; value: string; destructive?: boolean }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium uppercase text-muted-foreground">{title}</h3>
      <p
        className={
          destructive
            ? 'whitespace-pre-wrap break-words text-sm leading-6 text-destructive'
            : 'whitespace-pre-wrap break-words text-sm leading-6'
        }
      >
        {value}
      </p>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-md border border-dashed bg-muted/30 px-6 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border bg-background">
          <ImageIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium">{copy.emptyTitle}</p>
        <p className="text-sm leading-6 text-muted-foreground">{copy.emptyBody}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: HistoryTaskStatus }) {
  if (status === 'completed') {
    return <Badge>{copy.completed}</Badge>;
  }

  if (status === 'failed') {
    return <Badge variant="destructive">{copy.failed}</Badge>;
  }

  if (status === 'processing') {
    return <Badge variant="secondary">{copy.processing}</Badge>;
  }

  return <Badge variant="outline">{copy.queued}</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatParams(params: unknown) {
  if (!params || typeof params !== 'object') {
    return '-';
  }

  const record = params as Record<string, unknown>;
  const parts = [
    ['width', record.width],
    ['height', record.height],
    ['steps', record.steps],
    ['cfg', record.cfg],
    ['sampler', record.sampler],
    ['seed', record.seed],
  ]
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}: ${String(value)}`);

  return parts.length > 0 ? parts.join('\n') : JSON.stringify(params, null, 2);
}
