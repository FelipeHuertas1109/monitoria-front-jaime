'use client';

import { useAuth } from '../../context/AuthContext';
import AuthContainer from '../../components/AuthContainer';
import HorariosManager from '../../components/HorariosManager';

export default function HorariosPage() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Acceso a Gestión de Horarios
            </h1>
            <p className="text-gray-600 mt-2">
              Debes iniciar sesión para acceder a la gestión de horarios
            </p>
          </div>
          <AuthContainer />
        </div>
      </div>
    );
  }

  return <HorariosManager />;
}
