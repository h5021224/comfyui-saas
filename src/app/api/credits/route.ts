import { NextResponse } from 'next/server';

import { getCurrentUserId } from '@/lib/auth/currentUser';
import { getBalance } from '@/lib/credits';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request).catch(() => null);

  if (!userId) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        message: 'Unauthorized',
      },
      { status: 401 },
    );
  }

  const balance = await getBalance(userId);

  if (!balance) {
    return NextResponse.json(
      {
        error: 'not_found',
        message: 'User not found',
      },
      { status: 404 },
    );
  }

  return NextResponse.json(balance);
}
