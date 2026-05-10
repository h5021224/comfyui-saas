import { jwtVerify } from 'jose';

import { auth } from '@/auth';

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET is required');
  }

  return new TextEncoder().encode(secret);
}

export async function getCurrentUserId(request: Request) {
  const user = await getCurrentUser(request);

  return user?.id ?? null;
}

export async function getCurrentUser(request: Request) {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice('Bearer '.length) : null;

  if (token) {
    const { payload } = await jwtVerify(token, getJwtSecret());

    return typeof payload.sub === 'string'
      ? {
          id: payload.sub,
          email: typeof payload.email === 'string' ? payload.email : undefined,
        }
      : null;
  }

  const session = await auth();

  return session?.user?.id
    ? {
        id: session.user.id,
        email: session.user.email ?? undefined,
      }
    : null;
}
