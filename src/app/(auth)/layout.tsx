import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link className="block text-center text-lg font-semibold tracking-normal" href="/">
          ComfyUI SaaS
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">账号访问</CardTitle>
            <CardDescription>登录后管理积分、生成图片和查看历史记录。</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
