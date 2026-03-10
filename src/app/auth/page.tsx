'use client';

import { useRouter } from 'next/navigation';
import OTPLogin from '@/components/Auth/OTPLogin';
import { useAuth } from '@/contexts/AuthContext';
import './auth.css';

export default function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();

  // If already logged in, redirect to home
  if (user) {
    router.push('/');
    return null;
  }

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="auth-page">
      <OTPLogin onSuccess={handleSuccess} />
    </div>
  );
}
