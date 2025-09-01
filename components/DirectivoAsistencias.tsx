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
      <h1 className="text-2xl font-semibold mb-4">Asistencias del día</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Estado</label>
          <select className="w-full border rounded px-3 py-2" value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoAutorizacion | '')}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="autorizado">Autorizado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Jornada</label>
          <select className="w-full border rounded px-3 py-2" value={jornada}
            onChange={(e) => setJornada(e.target.value as Jornada | '')}
          >
            <option value="">Todas</option>
            <option value="M">Mañana</option>
            <option value="T">Tarde</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sede</label>
          <select className="w-full border rounded px-3 py-2" value={sede}
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
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600 text-sm">{error}</div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monitor</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Jornada</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sede</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Presente</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {asistencias.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-sm">{a.monitor.nombre} ({a.monitor.username})</td>
                <td className="px-4 py-2 text-sm">{a.jornada}</td>
                <td className="px-4 py-2 text-sm">{a.sede}</td>
                <td className="px-4 py-2 text-sm">{a.presente ? 'Sí' : 'No'}</td>
                <td className="px-4 py-2 text-sm capitalize">{a.estado_autorizacion}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-green-600 text-white disabled:opacity-50"
                      onClick={() => handleAutorizar(a.id)}
                      disabled={a.estado_autorizacion === 'autorizado'}
                    >
                      Autorizar
                    </button>
                    <button
                      className="px-3 py-1 rounded bg-red-600 text-white disabled:opacity-50"
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
                <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


