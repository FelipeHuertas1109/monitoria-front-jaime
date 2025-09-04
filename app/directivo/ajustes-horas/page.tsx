'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import DirectivoAjustesHoras from '../../../components/DirectivoAjustesHoras';

export default function Page() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && (!user || user.tipo_usuario !== 'DIRECTIVO')) {
      router.push('/');
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || !user || user.tipo_usuario !== 'DIRECTIVO') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <DirectivoAjustesHoras />
    </div>
  );
}


