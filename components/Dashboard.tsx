'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const [availableJornadas, setAvailableJornadas] = useState<{ M: boolean; T: boolean }>({ M: false, T: false });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [cardOrder, setCardOrder] = useState<number[]>([]);

  // Definir las tarjetas de directivo
  const directivoCards = [
    { id: 0, href: '/directivo/asistencias', title: 'Autorizar Monitores', description: 'Revisar y autorizar asistencias del día', color: 'green', icon: 'M5 13l4 4L19 7' },
    { id: 1, href: '/directivo/horarios', title: 'Ver Horarios', description: 'Consultar todos los horarios de monitores', color: 'blue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 2, href: '/directivo/reportes', title: '📊 Reportes', description: 'Estadísticas y análisis de asistencias', color: 'purple', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4' },
    { id: 3, href: '/directivo/ajustes-horas', title: 'Ajustes de Horas', description: 'Dar o quitar horas manualmente', color: 'amber', icon: 'M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v6h8v-6c0-2.21-1.79-4-4-4z' },
    { id: 4, href: '/directivo/heatmap', title: '🗺️ Mapa de Calor', description: 'Visualización anual de asistencias', color: 'pink', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4' },
    { id: 5, href: '/directivo/finanzas', title: '💰 Finanzas', description: 'Análisis financiero y proyecciones de costos', color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' }
  ];

  // Inicializar orden de tarjetas
  useEffect(() => {
    if (isDirectivo && cardOrder.length === 0) {
      // Intentar cargar orden guardado desde localStorage
      const savedOrder = localStorage.getItem('dashboard-card-order');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          // Verificar que el orden guardado sea válido
          if (Array.isArray(parsedOrder) && parsedOrder.length === directivoCards.length) {
            setCardOrder(parsedOrder);
          } else {
            setCardOrder(directivoCards.map(card => card.id));
          }
        } catch {
          setCardOrder(directivoCards.map(card => card.id));
        }
      } else {
        setCardOrder(directivoCards.map(card => card.id));
      }
    }
  }, [isDirectivo, cardOrder.length]);

  // Guardar orden cuando cambie
  useEffect(() => {
    if (isDirectivo && cardOrder.length > 0) {
      localStorage.setItem('dashboard-card-order', JSON.stringify(cardOrder));
    }
  }, [cardOrder, isDirectivo]);

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newOrder = [...cardOrder];
    const draggedItem = newOrder[draggedIndex];
    
    // Remover el elemento arrastrado
    newOrder.splice(draggedIndex, 1);
    
    // Insertar en la nueva posición
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setCardOrder(newOrder);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Función para renderizar una tarjeta
  const renderCard = (card: typeof directivoCards[0], index: number) => {
    const colorClasses = {
      green: 'border-green-500 bg-green-100 text-green-600',
      blue: 'border-blue-500 bg-blue-100 text-blue-600',
      purple: 'border-purple-500 bg-purple-100 text-purple-600',
      amber: 'border-amber-500 bg-amber-100 text-amber-600',
      pink: 'border-pink-500 bg-pink-100 text-pink-600',
      emerald: 'border-emerald-500 bg-emerald-100 text-emerald-600'
    };

    return (
      <Link key={card.id} href={card.href} className="block">
        <div 
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 p-4 sm:p-6 border-l-4 cursor-move h-32 flex flex-col justify-between ${
            draggedIndex === index 
              ? 'opacity-50 scale-95 shadow-lg' 
              : 'hover:scale-[1.01]'
          }`}
          style={{ borderLeftColor: `var(--${card.color}-500)` }}
        >
          <div className="flex items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[card.color as keyof typeof colorClasses]}`}>
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{card.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{card.description}</p>
            </div>
          </div>
          <div className="mt-auto">
            <span className={`inline-flex items-center text-xs sm:text-sm font-medium ${colorClasses[card.color as keyof typeof colorClasses].split(' ')[2]}`}>
              Acceder
              <svg className="ml-1 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const checkAuthorization = async () => {
    if (!token || isDirectivo) return;
    try {
      const list = await AsistenciasService.misAsistencias({ fecha: todayBogota() }, token);
      console.log('Dashboard - Asistencias recibidas:', list);
      
      if (Array.isArray(list) && list.length > 0) {
        // Determinar qué jornadas están disponibles para este monitor
        const hasM = list.some(a => a.horario.jornada === 'M');
        const hasT = list.some(a => a.horario.jornada === 'T');
        setAvailableJornadas({ M: hasM, T: hasT });
        
        // Solo mostrar sección de marcación rápida si hay asistencias autorizadas
        const anyAuthorized = list.some(a => a.estado_autorizacion === 'autorizado' && !a.presente);
        console.log('Dashboard - Hay autorizados:', anyAuthorized);
        setCanQuickMark(Boolean(anyAuthorized));
        
        // Actualizar estado de marcación
        const markedM = list.some(a => a.horario.jornada === 'M' && a.presente);
        const markedT = list.some(a => a.horario.jornada === 'T' && a.presente);
        setMarkedJornadas({ M: markedM, T: markedT });
      } else {
        // No hay asistencias generadas para hoy
        setAvailableJornadas({ M: false, T: false });
        setCanQuickMark(false);
        setMarkedJornadas({ M: false, T: false });
      }
    } catch (error) {
      console.error('Dashboard - Error al verificar autorización:', error);
      setCanQuickMark(false);
      setAvailableJornadas({ M: false, T: false });
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
            {!isDirectivo && (
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
            )}

            {isDirectivo && (
              <>
                {/* Tarjetas arrastrables */}
                {cardOrder.map((cardId, index) => {
                  const card = directivoCards.find(c => c.id === cardId);
                  if (!card) return null;
                  return renderCard(card, index);
                })}
              </>
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
                  {availableJornadas.M && (
                    markedJornadas.M ? (
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
                    )
                  )}
                  
                  {availableJornadas.T && (
                    markedJornadas.T ? (
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
                    )
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
