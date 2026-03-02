'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PropertyDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#marketplace');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Redirigiendo...</p>
    </div>
  );
}
