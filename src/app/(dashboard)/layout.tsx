import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { getBalance } from '@/lib/credits';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const balance = await getBalance(session.user.id);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav
        user={{
          email: session.user.email,
          name: session.user.name,
        }}
        credits={balance?.credits ?? 0}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
