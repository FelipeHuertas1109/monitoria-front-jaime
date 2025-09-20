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
