'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { DirectivoHorariosService, DirectivoHorarioParams, DirectivoHorarioResponse } from '../services/directivoHorarios';

const DIAS_SEMANA = {
  '0': 'Lunes',
  '1': 'Martes',
  '2': 'Miércoles',
  '3': 'Jueves',
  '4': 'Viernes',
  '5': 'Sábado',
  '6': 'Domingo'
};

const JORNADAS = {
  'M': 'Mañana',
  'T': 'Tarde'
};

const SEDES = {
  'SA': 'San Antonio',
  'BA': 'Barcelona'
};

export default function DirectivoHorarios() {
  const { token } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DirectivoHorarioResponse | null>(null);
  
  // Filtros
  const [filtros, setFiltros] = useState<DirectivoHorarioParams>({});
  const [diaSemana, setDiaSemana] = useState<string>('');
  const [jornada, setJornada] = useState<string>('');
  const [sede, setSede] = useState<string>('');

  useEffect(() => {
    if (token) {
      cargarHorarios();
    }
  }, [token]);

  const cargarHorarios = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: DirectivoHorarioParams = {};
      if (diaSemana !== '') params.dia_semana = parseInt(diaSemana);
      if (jornada) params.jornada = jornada as 'M' | 'T';
      if (sede) params.sede = sede as 'SA' | 'BA';
      
      const response = await DirectivoHorariosService.listarTodos(params, token);
      setData(response);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar horarios';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setDiaSemana('');
    setJornada('');
    setSede('');
    setFiltros({});
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Horarios de Monitores
          </h1>
          {data && (
            <p className="text-sm text-gray-600 mt-1">
              {data.total_horarios} horarios de {data.total_monitores} monitores
            </p>
          )}
        </div>
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

      {/* Filtros */}
      <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100 mb-6">
        <h3 className="text-sm font-semibold text-indigo-700 mb-3">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Día</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
            >
              <option value="" className="text-gray-900">Todos los días</option>
              {Object.entries(DIAS_SEMANA).map(([key, value]) => (
                <option key={key} value={key} className="text-gray-900">{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Jornada</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
            >
              <option value="" className="text-gray-900">Todas las jornadas</option>
              {Object.entries(JORNADAS).map(([key, value]) => (
                <option key={key} value={key} className="text-gray-900">{value}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Sede</label>
            <select 
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              value={sede}
              onChange={(e) => setSede(e.target.value)}
            >
              <option value="" className="text-gray-900">Todas las sedes</option>
              {Object.entries(SEDES).map(([key, value]) => (
                <option key={key} value={key} className="text-gray-900">{value}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={cargarHorarios}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-sm font-medium"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button
              onClick={limpiarFiltros}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Vista Calendario por Días */}
      <div className="space-y-6">
        {Object.entries(DIAS_SEMANA).map(([diaNum, diaNombre]) => {
          const horariosDelDia = data?.horarios.filter(h => h.dia_semana.toString() === diaNum) || [];
          
          if (horariosDelDia.length === 0) return null;
          
          const horariosManana = horariosDelDia.filter(h => h.jornada === 'M');
          const horariosTarde = horariosDelDia.filter(h => h.jornada === 'T');
          
          return (
            <div key={diaNum} className="bg-white border rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-indigo-700">{diaNombre}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {horariosDelDia.length} horario{horariosDelDia.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mañana */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h4 className="font-medium text-gray-800">Mañana</h4>
                      <span className="text-sm text-gray-500">({horariosManana.length})</span>
                    </div>
                    
                    {horariosManana.length > 0 ? (
                      <div className="space-y-3">
                        {horariosManana.map((horario) => (
                          <div key={horario.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex-shrink-0">
                              {horario.usuario.nombre?.slice(0,1) || 'M'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{horario.usuario.nombre}</p>
                              <p className="text-xs text-gray-500">@{horario.usuario.username}</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {horario.sede_display}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">Sin monitores en la mañana</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Tarde */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      <h4 className="font-medium text-gray-800">Tarde</h4>
                      <span className="text-sm text-gray-500">({horariosTarde.length})</span>
                    </div>
                    
                    {horariosTarde.length > 0 ? (
                      <div className="space-y-3">
                        {horariosTarde.map((horario) => (
                          <div key={horario.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold flex-shrink-0">
                              {horario.usuario.nombre?.slice(0,1) || 'M'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{horario.usuario.nombre}</p>
                              <p className="text-xs text-gray-500">@{horario.usuario.username}</p>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {horario.sede_display}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm">Sin monitores en la tarde</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {data?.horarios.length === 0 && !loading && (
          <div className="bg-white border rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay horarios</h3>
            <p className="text-gray-500">No se encontraron horarios para los filtros seleccionados.</p>
          </div>
        )}
      </div>


    </div>
  );
}
