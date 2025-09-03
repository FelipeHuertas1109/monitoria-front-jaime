'use client';

import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DirectivoReportes from '../../../components/DirectivoReportes';

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

  return <DirectivoReportes />;
}
