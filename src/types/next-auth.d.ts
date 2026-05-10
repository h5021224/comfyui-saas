import { type DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'user' | 'admin';
      credits: number;
    } & DefaultSession['user'];
  }

  interface User {
    role: 'user' | 'admin';
    credits: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'user' | 'admin';
    credits: number;
  }
}
