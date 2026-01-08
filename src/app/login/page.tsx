import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { PageLoader } from '@/components/ui/PageLoader';

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthForm mode="login" />
    </Suspense>
  );
}
