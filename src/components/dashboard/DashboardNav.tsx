'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coins, CreditCard, History, ImagePlus, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DashboardNavProps = {
  user: {
    email?: string | null;
    name?: string | null;
  };
  credits: number;
};

const navItems = [
  {
    href: '/generate',
    label: 'Generate',
    icon: ImagePlus,
  },
  {
    href: '/history',
    label: 'History',
    icon: History,
  },
  {
    href: '/billing',
    label: 'Billing',
    icon: CreditCard,
  },
];

export function DashboardNav({ user, credits }: DashboardNavProps) {
  const pathname = usePathname();
  const initial = (user.name ?? user.email ?? 'U').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/generate" className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>ComfyUI SaaS</span>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 border bg-background px-2.5 py-1">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              {credits} credits
            </Badge>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted text-xs font-semibold">
              {initial}
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Button
                asChild
                key={item.href}
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                className={cn('min-w-fit gap-2', isActive && 'border')}
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
