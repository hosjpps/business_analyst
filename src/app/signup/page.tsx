import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
