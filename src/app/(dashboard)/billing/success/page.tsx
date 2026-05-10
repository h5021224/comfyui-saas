import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-normal">充值处理中</h1>
        <p className="text-muted-foreground">Stripe 已返回支付结果，积分会在 webhook 确认后到账。</p>
        <Button asChild>
          <Link href="/generate">返回生图</Link>
        </Button>
      </div>
    </main>
  );
}
