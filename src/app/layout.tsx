import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComfyUI SaaS',
  description: 'Credit-based text-to-image generation powered by ComfyUI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
