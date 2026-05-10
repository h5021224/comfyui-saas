'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Coins, CreditCard, Loader2, RefreshCw, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Transaction = {
  id: string;
  amount: number;
  type: 'purchase' | 'consume' | 'refund' | 'gift';
  balanceAfter: number;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
};

type CreditsResponse = {
  credits: number;
  transactions: Transaction[];
};

type PackageId = 'starter' | 'standard' | 'premium';

const copy = {
  title: '\u79ef\u5206\u4e2d\u5fc3',
  subtitle:
    '\u67e5\u770b\u5f53\u524d\u4f59\u989d\uff0c\u9009\u62e9\u79ef\u5206\u5305\u8fdb\u5165 Stripe Checkout\uff0c\u5e76\u8ddf\u8e2a\u6bcf\u4e00\u7b14\u79ef\u5206\u6d41\u6c34\u3002',
  balance: '\u5f53\u524d\u4f59\u989d',
  packages: '\u79ef\u5206\u5305',
  transactions: '\u79ef\u5206\u6d41\u6c34',
  refresh: '\u5237\u65b0',
  checkout: '\u53bb\u652f\u4ed8',
  emptyTransactions: '\u6682\u65e0\u79ef\u5206\u6d41\u6c34',
  stripeNotConfigured: 'Stripe \u5c1a\u672a\u914d\u7f6e\uff0c\u5148\u4fdd\u7559\u5145\u503c\u5165\u53e3\u3002',
  error: '\u64cd\u4f5c\u5931\u8d25',
  credits: '\u79ef\u5206',
};

const packages: Array<{
  id: PackageId;
  name: string;
  price: string;
  credits: number;
  note: string;
  highlighted?: boolean;
}> = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$2',
    credits: 20,
    note: '\u9002\u5408\u8bd5\u7528\u548c\u5c0f\u6279\u91cf\u751f\u6210',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '$5',
    credits: 60,
    note: '\u65e5\u5e38\u751f\u6210\u66f4\u5212\u7b97',
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$10',
    credits: 150,
    note: '\u9002\u5408\u5bc6\u96c6\u6d4b\u8bd5\u548c\u6279\u91cf\u521b\u4f5c',
  },
];

export function BillingDashboard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutPackage, setCheckoutPackage] = useState<PackageId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void refreshCredits();
  }, []);

  async function refreshCredits() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/credits', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Credits request failed: ${response.status}`);
      }

      const data = (await response.json()) as CreditsResponse;
      setCredits(data.credits);
      setTransactions(data.transactions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.error);
    } finally {
      setIsLoading(false);
    }
  }

  async function startCheckout(packageId: PackageId) {
    setCheckoutPackage(packageId);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });
      const data = (await response.json().catch(() => null)) as { checkoutUrl?: string; message?: string; error?: string } | null;

      if (!response.ok) {
        throw new Error(data?.message ?? data?.error ?? `Checkout request failed: ${response.status}`);
      }

      if (!data?.checkoutUrl) {
        throw new Error('Stripe checkout URL was not returned');
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.error);
      setCheckoutPackage(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{copy.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.subtitle}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={refreshCredits} disabled={isLoading}>
          <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          {copy.refresh}
        </Button>
      </div>

      {errorMessage ? (
        <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <div className="rounded-md border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{copy.balance}</p>
              <p className="mt-3 text-5xl font-semibold tracking-normal">{isLoading ? '-' : credits ?? 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
              <Coins className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-5 rounded-md bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
            {copy.stripeNotConfigured}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">{copy.packages}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {packages.map((item) => (
              <div
                key={item.id}
                className={
                  item.highlighted
                    ? 'rounded-md border border-foreground/30 bg-card p-5 shadow-sm'
                    : 'rounded-md border bg-card p-5'
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{item.name}</h3>
                  {item.highlighted ? <Badge>{copy.credits}</Badge> : <CreditCard className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="mt-4 text-3xl font-semibold">{item.price}</p>
                <p className="mt-2 text-sm font-medium">
                  {item.credits} {copy.credits}
                </p>
                <p className="mt-3 min-h-10 text-sm leading-5 text-muted-foreground">{item.note}</p>
                <Button
                  type="button"
                  className="mt-5 w-full gap-2"
                  variant={item.highlighted ? 'default' : 'outline'}
                  onClick={() => startCheckout(item.id)}
                  disabled={checkoutPackage !== null}
                >
                  {checkoutPackage === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {copy.checkout}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-5">
          <h2 className="text-sm font-medium">{copy.transactions}</h2>
          <Badge variant="outline">{transactions.length}</Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">{copy.emptyTransactions}</div>
        ) : (
          <div className="divide-y">
            {transactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isPositive = transaction.amount > 0;

  return (
    <div className="grid gap-3 p-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <TransactionBadge type={transaction.type} />
          <span className="text-muted-foreground">{formatDate(transaction.createdAt)}</span>
        </div>
        <p className="mt-1 truncate text-muted-foreground">{transaction.description ?? transaction.referenceId ?? '-'}</p>
      </div>
      <div className={isPositive ? 'font-semibold text-emerald-600' : 'font-semibold text-foreground'}>
        {isPositive ? '+' : ''}
        {transaction.amount}
      </div>
      <div className="text-muted-foreground">
        {transaction.balanceAfter} {copy.credits}
      </div>
    </div>
  );
}

function TransactionBadge({ type }: { type: Transaction['type'] }) {
  if (type === 'purchase') {
    return (
      <Badge variant="secondary" className="gap-1">
        <Check className="h-3 w-3" />
        purchase
      </Badge>
    );
  }

  if (type === 'refund') {
    return <Badge variant="outline">refund</Badge>;
  }

  if (type === 'gift') {
    return <Badge>gift</Badge>;
  }

  return <Badge variant="outline">consume</Badge>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
