import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

import { verifyCredentials } from '@/lib/auth/credentials';

export const runtime = 'nodejs';

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is required');
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const user = await verifyCredentials(body);

  if (!user) {
    return NextResponse.json(
      {
        error: 'invalid_credentials',
        message: '邮箱或密码错误',
      },
      { status: 401 },
    );
  }

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    credits: user.credits,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());

  return NextResponse.json({
    user,
    token,
  });
}
