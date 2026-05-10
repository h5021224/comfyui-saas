import { LoginForm } from '@/components/auth/LoginForm';

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl?.startsWith('/') ? params.callbackUrl : '/generate';

  return <LoginForm callbackUrl={callbackUrl} />;
}
