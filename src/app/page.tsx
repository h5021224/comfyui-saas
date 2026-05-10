import Link from 'next/link';
import { ArrowRight, Coins, Images, WandSparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const copy = {
  title: '\u79ef\u5206\u5236 AI \u6587\u751f\u56fe\u5e73\u53f0',
  description:
    '\u7528\u672c\u5730 ComfyUI \u8d1f\u8d23\u751f\u6210\uff0cNext.js \u8d1f\u8d23\u8d26\u6237\u3001\u79ef\u5206\u3001\u652f\u4ed8\u548c\u5386\u53f2\u7ba1\u7406\uff0c\u628a\u4e2a\u4eba\u5de5\u4f5c\u6d41\u5305\u88c5\u6210\u53ef\u8fd0\u8425\u7684\u8f7b\u91cf SaaS\u3002',
  start: '\u5f00\u59cb\u751f\u6210',
  login: '\u767b\u5f55',
  latestTitle: '\u57ce\u5e02\u591c\u666f\u6982\u5ff5\u56fe',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto grid min-h-[88vh] max-w-7xl content-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">ComfyUI SaaS</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-foreground sm:text-6xl">{copy.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/generate">
                {copy.start}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">{copy.login}</Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <WandSparkles className="h-4 w-4 text-foreground" aria-hidden="true" />
              ComfyUI API
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-foreground" aria-hidden="true" />
              Credits billing
            </div>
            <div className="flex items-center gap-2">
              <Images className="h-4 w-4 text-foreground" aria-hidden="true" />
              Image history
            </div>
          </div>
        </div>

        <div
          className="relative min-h-[28rem] overflow-hidden rounded-md border bg-cover bg-center bg-zinc-950 text-white shadow-2xl"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('https://images.unsplash.com/photo-1635776062360-af423602aff3?auto=format&fit=crop&w=1200&q=80')",
          }}
        >
          <div className="relative grid h-full content-end gap-4 p-5 sm:p-8">
            <div className="max-w-md">
              <p className="text-sm text-zinc-300">Latest generation</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">{copy.latestTitle}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-zinc-300">Status</p>
                <p className="mt-2 font-medium">Completed</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-zinc-300">Cost</p>
                <p className="mt-2 font-medium">1 credit</p>
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs text-zinc-300">Size</p>
                <p className="mt-2 font-medium">512 x 512</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
