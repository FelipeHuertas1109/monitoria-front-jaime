'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { AsistenciasService } from '../services/asistencias';
import { EstadoAutorizacion, Jornada, Sede, Asistencia } from '../types/asistencias';
import { todayBogota } from '../utils/date';

export default function DirectivoAsistencias() {
  const { token } = useAuth();
  const [fecha, setFecha] = useState<string>(todayBogota());
  const [estado, setEstado] = useState<EstadoAutorizacion | ''>('');
  const [jornada, setJornada] = useState<Jornada | ''>('');
  const [sede, setSede] = useState<Sede | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);

  const canQuery = useMemo(() => Boolean(token && fecha), [token, fecha]);

  useEffect(() => {
    if (canQuery) {
      fetchAsistencias();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchAsistencias = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await AsistenciasService.listar({ fecha, estado, jornada, sede }, token);
      setAsistencias(resp.resultados);
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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Asistencias del día
        </h1>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100">
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Fecha</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 text-gray-900"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Estado</label>
          <select className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400" value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoAutorizacion | '')}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="autorizado">Autorizado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Jornada</label>
          <select className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400" value={jornada}
            onChange={(e) => setJornada(e.target.value as Jornada | '')}
          >
            <option value="">Todas</option>
            <option value="M">Mañana</option>
            <option value="T">Tarde</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-indigo-700">Sede</label>
          <select className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400" value={sede}
            onChange={(e) => setSede(e.target.value as Sede | '')}
          >
            <option value="">Todas</option>
            <option value="SA">San Antonio</option>
            <option value="BA">Barcelona</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchAsistencias}
            disabled={!canQuery || loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Monitor</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Jornada</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Sede</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Presente</th>
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
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {a.horario.jornada_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                    {a.horario.sede_display}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={a.presente ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800' : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700'}>
                    {a.presente ? 'Sí' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {a.estado_autorizacion === 'autorizado' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">{a.estado_autorizacion_display}</span>
                  )}
                  {a.estado_autorizacion === 'pendiente' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{a.estado_autorizacion_display}</span>
                  )}
                  {a.estado_autorizacion === 'rechazado' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">{a.estado_autorizacion_display}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-emerald-600 text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                      onClick={() => handleAutorizar(a.id)}
                      disabled={a.estado_autorizacion === 'autorizado'}
                    >
                      Autorizar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-rose-600 text-white shadow hover:bg-rose-700 disabled:opacity-50"
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
                <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={6}>
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


