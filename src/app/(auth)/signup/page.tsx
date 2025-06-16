// src/app/(auth)/signup/page.tsx
'use client';

import SignupForm from '@/components/SignupForm'; // Make sure this component exists

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <SignupForm />
    </div>
  );
}
