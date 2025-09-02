'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { AsistenciasService } from '../services/asistencias';
import { EstadoAutorizacion, Jornada, Sede, Asistencia } from '../types/asistencias';
import { todayBogota } from '../utils/date';

export default function DirectivoAsistencias() {
  const { token } = useAuth();
  const router = useRouter();
  const [fecha, setFecha] = useState<string>(todayBogota());
  const [estado, setEstado] = useState<EstadoAutorizacion | ''>('');
  const [jornada, setJornada] = useState<Jornada | ''>('');
  const [sede, setSede] = useState<Sede | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const canQuery = useMemo(() => Boolean(token && fecha), [token, fecha]);

  useEffect(() => {
    if (canQuery) {
      fetchAsistencias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!canQuery) return;
    
    const interval = setInterval(() => {
      fetchAsistencias();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [canQuery]);

  const fetchAsistencias = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await AsistenciasService.listar({ fecha, estado, jornada, sede }, token);
      setAsistencias(resp.resultados);
      setLastUpdate(new Date());
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al listar asistencias';
      setError(msg);
      if (msg.includes('Sesión vencida')) {
        Swal.fire({ icon: 'warning', title: 'Sesión', text: msg });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAutorizar = async (id: number) => {
    if (!token) return;
    try {
      // Optimistic UI
      setAsistencias(prev => prev.map(a => (a.id === id ? { ...a, estado_autorizacion: 'autorizado' } : a)));
      const updated = await AsistenciasService.autorizar(id, token);
      setAsistencias(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al autorizar';
      await Swal.fire({ icon: 'error', title: 'No se pudo autorizar', text: msg });
      // Revertir consultando de nuevo
      fetchAsistencias();
    }
  };

  const handleRechazar = async (id: number) => {
    if (!token) return;
    const confirm = await Swal.fire({
      title: 'Rechazar asistencia',
      text: '¿Seguro que deseas rechazar esta asistencia?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      // Optimistic UI
      setAsistencias(prev => prev.map(a => (a.id === id ? { ...a, estado_autorizacion: 'rechazado' } : a)));
      const updated = await AsistenciasService.rechazar(id, token);
      setAsistencias(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al rechazar';
      await Swal.fire({ icon: 'error', title: 'No se pudo rechazar', text: msg });
      fetchAsistencias();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Asistencias del día
          </h1>
          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-1">
              Última actualización: {lastUpdate.toLocaleTimeString()} 
              <span className="ml-2 inline-flex items-center">
                <svg className="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Actualización automática cada 30s
              </span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100">
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Fecha</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Estado</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900" value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoAutorizacion | '')}
          >
            <option value="" className="text-gray-900">Todos</option>
            <option value="pendiente" className="text-gray-900">Pendiente</option>
            <option value="autorizado" className="text-gray-900">Autorizado</option>
            <option value="rechazado" className="text-gray-900">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Jornada</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900" value={jornada}
            onChange={(e) => setJornada(e.target.value as Jornada | '')}
          >
            <option value="" className="text-gray-900">Todas</option>
            <option value="M" className="text-gray-900">Mañana</option>
            <option value="T" className="text-gray-900">Tarde</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Sede</label>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900" value={sede}
            onChange={(e) => setSede(e.target.value as Sede | '')}
          >
            <option value="" className="text-gray-900">Todas</option>
            <option value="SA" className="text-gray-900">San Antonio</option>
            <option value="BA" className="text-gray-900">Barcelona</option>
          </select>
        </div>
        <div className="flex items-end sm:col-span-1 lg:col-span-1">
          <button
            onClick={fetchAsistencias}
            disabled={!canQuery || loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-sm font-medium"
          >
            {loading ? 'Cargando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {/* Tabla - Vista desktop */}
      <div className="hidden md:block overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Monitor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Día</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Jornada</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Sede</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Marcado</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {asistencias.map((a) => (
              <tr key={a.id} className="hover:bg-indigo-50/40">
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {a.usuario.nombre?.slice(0,1) || 'M'}
                    </span>
                    <span className="text-gray-900 font-medium">{a.usuario.nombre} ({a.usuario.username})</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {a.horario.dia_semana_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {a.horario.jornada_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {a.horario.sede_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={a.presente ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700' : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700'}>
                    {a.presente ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {a.estado_autorizacion === 'autorizado' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{a.estado_autorizacion_display}</span>
                  )}
                  {a.estado_autorizacion === 'pendiente' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">{a.estado_autorizacion_display}</span>
                  )}
                  {a.estado_autorizacion === 'rechazado' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{a.estado_autorizacion_display}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-green-600 text-white shadow hover:bg-green-700 disabled:opacity-50 text-xs"
                      onClick={() => handleAutorizar(a.id)}
                      disabled={a.estado_autorizacion === 'autorizado'}
                    >
                      Autorizar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-50 text-xs"
                      onClick={() => handleRechazar(a.id)}
                      disabled={a.estado_autorizacion === 'rechazado'}
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {asistencias.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={7}>
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Vista mobile - Tarjetas */}
      <div className="md:hidden space-y-4">
        {asistencias.map((a) => (
          <div key={a.id} className="bg-white border rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {a.usuario.nombre?.slice(0,1) || 'M'}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.usuario.nombre}</p>
                  <p className="text-xs text-gray-500">@{a.usuario.username}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Día</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mt-1">
                  {a.horario.dia_semana_display}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Jornada</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mt-1">
                  {a.horario.jornada_display}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Sede</p>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 mt-1">
                  {a.horario.sede_display}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Marcado</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold mt-1 ${a.presente ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {a.presente ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase font-semibold">Estado</p>
              <div className="mt-1">
                {a.estado_autorizacion === 'autorizado' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">{a.estado_autorizacion_display}</span>
                )}
                {a.estado_autorizacion === 'pendiente' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">{a.estado_autorizacion_display}</span>
                )}
                {a.estado_autorizacion === 'rechazado' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{a.estado_autorizacion_display}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                className="flex-1 px-3 py-2 rounded bg-green-600 text-white shadow hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                onClick={() => handleAutorizar(a.id)}
                disabled={a.estado_autorizacion === 'autorizado'}
              >
                Autorizar
              </button>
              <button
                className="flex-1 px-3 py-2 rounded bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                onClick={() => handleRechazar(a.id)}
                disabled={a.estado_autorizacion === 'rechazado'}
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
        {asistencias.length === 0 && !loading && (
          <div className="bg-white border rounded-lg shadow p-6 text-center">
            <p className="text-sm text-gray-500">Sin resultados para los filtros seleccionados</p>
          </div>
        )}
      </div>
    </div>
  );
}


