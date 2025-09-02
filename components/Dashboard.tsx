'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import { AsistenciasService } from '../services/asistencias';
import { todayBogota } from '../utils/date';
import type { Jornada } from '../types/asistencias';

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const isDirectivo = user?.tipo_usuario === 'DIRECTIVO';
  const [marking, setMarking] = useState<{ M: boolean; T: boolean }>({ M: false, T: false });
  const [canQuickMark, setCanQuickMark] = useState(false);
  const [markedJornadas, setMarkedJornadas] = useState<{ M: boolean; T: boolean }>({ M: false, T: false });

  const checkAuthorization = async () => {
    if (!token || isDirectivo) return;
    try {
      const list = await AsistenciasService.misAsistencias({ fecha: todayBogota() }, token);
      console.log('Dashboard - Asistencias recibidas:', list);
      
      // El endpoint puede devolver lista vacía si no hay asistencias generadas
      // Solo mostrar botón si hay asistencias autorizadas
      const anyAuthorized = Array.isArray(list) && list.some(a => a.estado_autorizacion === 'autorizado' && !a.presente);
      console.log('Dashboard - Hay autorizados:', anyAuthorized);
      setCanQuickMark(Boolean(anyAuthorized));
      
      // Actualizar estado de marcación
      const markedM = list.some(a => a.horario.jornada === 'M' && a.presente);
      const markedT = list.some(a => a.horario.jornada === 'T' && a.presente);
      setMarkedJornadas({ M: markedM, T: markedT });
    } catch (error) {
      console.error('Dashboard - Error al verificar autorización:', error);
      setCanQuickMark(false);
    }
  };

  useEffect(() => {
    checkAuthorization();
    
    // Polling cada 3 segundos para detectar cambios más rápido
    if (!isDirectivo) {
      const interval = setInterval(checkAuthorization, 3000);
      return () => clearInterval(interval);
    }
  }, [token, isDirectivo]);

  const handleMark = async (jornada: Jornada) => {
    if (!token) return;
    try {
      setMarking(prev => ({ ...prev, [jornada]: true }));
      await AsistenciasService.marcar({ fecha: todayBogota(), jornada }, token);
      
      // Mostrar alerta de éxito
      await Swal.fire({ 
        icon: 'success', 
        title: '¡Marcado exitosamente!', 
        text: `Has marcado tu asistencia de ${jornada === 'M' ? 'Mañana' : 'Tarde'}`,
        timer: 2000,
        showConfirmButton: false
      });
      
      // Actualizar estado local inmediatamente
      setMarkedJornadas(prev => ({ ...prev, [jornada]: true }));
      
      // Verificar estado actualizado del servidor
      setTimeout(checkAuthorization, 1000);
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo marcar';
      await Swal.fire({ icon: 'error', title: 'No se pudo marcar', text: msg });
    } finally {
      setMarking(prev => ({ ...prev, [jornada]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Panel de Control</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.nombre}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
              >
                <span className="hidden sm:inline">Cerrar Sesión</span>
                <span className="sm:hidden">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Welcome Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Estado</dt>
                      <dd className="text-base sm:text-lg font-medium text-gray-900">Conectado</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">Usuario</dt>
                      <dd className="text-base sm:text-lg font-medium text-gray-900 truncate">{user?.username}</dd>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate mt-1">Tipo</dt>
                      <dd className="text-xs sm:text-sm font-medium text-blue-600">{user?.tipo_usuario_display}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder para tercera columna en lg */}
            <div className="hidden lg:block"></div>

          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Link href="/horarios" className="block">
              <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Gestión de Horarios</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Crear y administrar horarios múltiples</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <span className="inline-flex items-center text-xs sm:text-sm font-medium text-blue-600">
                    Acceder
                    <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Placeholder for future modules */}
            <div className="bg-gray-50 rounded-lg shadow-md p-4 sm:p-6 border-l-4 border-gray-300 opacity-50">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-500 truncate">Reportes</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Próximamente disponible</p>
                </div>
              </div>
            </div>

            {isDirectivo && (
              <Link href="/directivo/asistencias" className="block">
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6 border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">Autorizar Monitores</h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">Revisar y autorizar asistencias del día</p>
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <span className="inline-flex items-center text-xs sm:text-sm font-medium text-green-600">
                      Acceder
                      <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Main Content Area - Quick actions */}
          {!isDirectivo && canQuickMark && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                <h3 className="text-base sm:text-lg leading-6 font-medium text-gray-900 mb-3 sm:mb-4">
                  Marcación rápida
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Marca tu asistencia del día rápidamente.</p>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                  {markedJornadas.M ? (
                    <div className="inline-flex items-center px-3 py-2 sm:px-4 rounded bg-green-100 text-green-800 border border-green-200 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Mañana marcada
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMark('M')}
                      disabled={marking.M}
                      className="inline-flex items-center justify-center px-3 py-2 sm:px-4 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 text-sm font-medium"
                    >
                      {marking.M ? 'Marcando Mañana...' : 'Marcar Mañana'}
                    </button>
                  )}
                  
                  {markedJornadas.T ? (
                    <div className="inline-flex items-center px-3 py-2 sm:px-4 rounded bg-green-100 text-green-800 border border-green-200 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Tarde marcada
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMark('T')}
                      disabled={marking.T}
                      className="inline-flex items-center justify-center px-3 py-2 sm:px-4 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 text-sm font-medium"
                    >
                      {marking.T ? 'Marcando Tarde...' : 'Marcar Tarde'}
                    </button>
                  )}
                  
                  <Link href="/monitor/asistencias" className="inline-flex items-center justify-center px-3 py-2 sm:px-4 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
                    Ver mis asistencias
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
