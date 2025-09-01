'use client';

import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { AsistenciasService } from '../services/asistencias';
import { Asistencia, Jornada } from '../types/asistencias';
import { todayBogota } from '../utils/date';

export default function MonitorAsistencias() {
  const { token } = useAuth();
  const [fecha, setFecha] = useState<string>(todayBogota());
  const [loading, setLoading] = useState(false);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await AsistenciasService.misAsistencias({ fecha }, token);
      setAsistencias(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar asistencias';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const marcar = async (jornada: Jornada) => {
    if (!token) return;
    try {
      // Optimistic UI: marcar presente=true y estado pendiente
      setAsistencias(prev => prev.map(a => (a.jornada === jornada ? { ...a, presente: true, estado_autorizacion: a.estado_autorizacion || 'pendiente' } : a)));
      const updated = await AsistenciasService.marcar({ fecha, jornada }, token);
      setAsistencias(prev => prev.map(a => (a.id === updated.id ? updated : a)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo marcar';
      Swal.fire({ icon: 'error', title: 'No se pudo marcar', text: msg });
      // revertir
      load();
    }
  };

  const estadoLabel = (a: Asistencia) => {
    if (!a.presente) return 'No marcado';
    if (a.estado_autorizacion === 'pendiente') return 'Marcado (pendiente de autorización)';
    if (a.estado_autorizacion === 'autorizado') return 'Marcado y autorizado ✅';
    if (a.estado_autorizacion === 'rechazado') return 'Marcado y rechazado ❌';
    return '—';
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Mis asistencias</h1>

      <div className="flex items-end gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <button
          onClick={load}
          disabled={!token || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {asistencias.map(a => (
          <div key={a.id} className="border rounded p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Jornada</div>
                <div className="font-medium">{a.jornada === 'M' ? 'Mañana' : 'Tarde'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Sede</div>
                <div className="font-medium">{a.sede === 'BA' ? 'Barcelona' : 'San Antonio'}</div>
              </div>
            </div>
            <div className="mt-3 text-sm">{estadoLabel(a)}</div>
            <div className="mt-3">
              <button
                onClick={() => marcar(a.jornada)}
                disabled={a.presente}
                className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
              >
                {a.presente ? 'Marcado' : 'Marcar'}
              </button>
            </div>
          </div>
        ))}
        {asistencias.length === 0 && !loading && (
          <div className="text-sm text-gray-500">No hay asistencias para la fecha</div>
        )}
      </div>
    </div>
  );
}


