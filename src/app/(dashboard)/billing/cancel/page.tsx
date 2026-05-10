import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function BillingCancelPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold tracking-normal">充值已取消</h1>
        <p className="text-muted-foreground">本次 Stripe Checkout 未完成支付，积分余额不会变化。</p>
        <Button asChild variant="outline">
          <Link href="/generate">返回生图</Link>
        </Button>
      </div>
    </main>
  );
}
