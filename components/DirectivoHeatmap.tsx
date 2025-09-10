'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HeatmapAsistencia from './HeatmapAsistencia';

export default function DirectivoHeatmap() {
  const router = useRouter();
  const [año, setAño] = useState(new Date().getFullYear());
  const [sede, setSede] = useState<'SA' | 'BA' | ''>('');
  const [jornada, setJornada] = useState<'M' | 'T' | ''>('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Mapa de Calor de Asistencia</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 text-sm"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Volver al inicio</span>
                <span className="sm:hidden">Volver</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100">
            <div>
              <label className="block text-xs font-semibold mb-1 text-indigo-700">Año</label>
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const añoOption = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={añoOption} value={añoOption}>
                      {añoOption}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold mb-1 text-indigo-700">Sede</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value as 'SA' | 'BA' | '')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
              >
                <option value="">Todas</option>
                <option value="SA">San Antonio</option>
                <option value="BA">Barcelona</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold mb-1 text-indigo-700">Jornada</label>
              <select
                value={jornada}
                onChange={(e) => setJornada(e.target.value as 'M' | 'T' | '')}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
              >
                <option value="">Todas</option>
                <option value="M">Mañana</option>
                <option value="T">Tarde</option>
              </select>
            </div>
            
            <div className="flex items-end sm:col-span-1 lg:col-span-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Presente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                  <span>Pendiente</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Rechazado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 rounded"></div>
                  <span>Ausente</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mapa de calor */}
          <HeatmapAsistencia 
            año={año}
            sede={sede}
            jornada={jornada}
          />
        </div>
      </main>
    </div>
  );
}
