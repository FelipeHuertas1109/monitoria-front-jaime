'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { AjustesHorasService } from '../services/ajustesHoras';
import { DirectivoService } from '../services/directivo';
import type { MonitorBasico } from '../types/directivo';
import type { ListarAjustesHorasQuery, AjusteHoras, CrearAjusteHorasRequest } from '../types/ajustesHoras';
import { todayBogota } from '../utils/date';

export default function DirectivoAjustesHoras() {
  const { token, user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ajustes, setAjustes] = useState<AjusteHoras[]>([]);
  const [resumen, setResumen] = useState<{ total_ajustes: number; total_horas_ajustadas: number; monitores_afectados: number } | null>(null);
  const [periodo, setPeriodo] = useState<{ fecha_inicio: string; fecha_fin: string } | null>(null);

  // Filtros
  const [monitorId, setMonitorId] = useState<string>('');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>(todayBogota());

  // Formulario de creación
  const [form, setForm] = useState<CrearAjusteHorasRequest>({ monitor_id: 0, fecha: todayBogota(), cantidad_horas: 1, motivo: '', asistencia_id: undefined });
  const [showForm, setShowForm] = useState(false);

  // Buscador en filtros
  const [buscaFiltro, setBuscaFiltro] = useState('');
  const [resultadosFiltro, setResultadosFiltro] = useState<MonitorBasico[]>([]);
  const [cargandoFiltro, setCargandoFiltro] = useState(false);
  const [timerFiltro, setTimerFiltro] = useState<NodeJS.Timeout | null>(null);

  // Buscador en formulario
  const [buscaForm, setBuscaForm] = useState('');
  const [resultadosForm, setResultadosForm] = useState<MonitorBasico[]>([]);
  const [cargandoForm, setCargandoForm] = useState(false);
  const [timerForm, setTimerForm] = useState<NodeJS.Timeout | null>(null);

  const canQuery = useMemo(() => Boolean(token && isAuthenticated && user?.tipo_usuario === 'DIRECTIVO'), [token, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!user || user.tipo_usuario !== 'DIRECTIVO') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (canQuery) {
      listar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canQuery]);

  const listar = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const params: ListarAjustesHorasQuery = {};
      if (monitorId) params.monitor_id = Number(monitorId);
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      const data = await AjustesHorasService.listar(params, token);
      setAjustes(data.ajustes);
      setResumen(data.estadisticas);
      setPeriodo(data.periodo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar ajustes';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const ejecutarBusqueda = async (q: string, destino: 'filtro' | 'form') => {
    if (!token) return;
    if (!q || q.trim().length < 2) {
      if (destino === 'filtro') setResultadosFiltro([]);
      else setResultadosForm([]);
      return;
    }
    try {
      destino === 'filtro' ? setCargandoFiltro(true) : setCargandoForm(true);
      const data = await DirectivoService.buscarMonitores(q.trim(), token);
      if (destino === 'filtro') setResultadosFiltro(data.monitores);
      else setResultadosForm(data.monitores);
    } catch (e) {
      // Silencioso en búsqueda
      if (destino === 'filtro') setResultadosFiltro([]);
      else setResultadosForm([]);
    } finally {
      destino === 'filtro' ? setCargandoFiltro(false) : setCargandoForm(false);
    }
  };

  const onChangeBusquedaFiltro = (val: string) => {
    setBuscaFiltro(val);
    if (timerFiltro) clearTimeout(timerFiltro);
    const t = setTimeout(() => ejecutarBusqueda(val, 'filtro'), 300);
    setTimerFiltro(t);
  };

  const onChangeBusquedaForm = (val: string) => {
    setBuscaForm(val);
    if (timerForm) clearTimeout(timerForm);
    const t = setTimeout(() => ejecutarBusqueda(val, 'form'), 300);
    setTimerForm(t);
  };

  const limpiarFiltros = () => {
    setMonitorId('');
    setFechaInicio('');
    setFechaFin(todayBogota());
  };

  const crearAjuste = async () => {
    if (!token) return;
    if (!form.monitor_id || !form.motivo || !form.fecha || !form.cantidad_horas) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Completa todos los campos requeridos' });
      return;
    }
    try {
      setLoading(true);
      const payload: CrearAjusteHorasRequest = {
        monitor_id: form.monitor_id,
        fecha: form.fecha,
        cantidad_horas: form.cantidad_horas,
        motivo: form.motivo,
        asistencia_id: form.asistencia_id || undefined,
      };
      const creado = await AjustesHorasService.crear(payload, token);
      setShowForm(false);
      setForm({ monitor_id: 0, fecha: todayBogota(), cantidad_horas: 1, motivo: '', asistencia_id: undefined });
      await Swal.fire({ 
        icon: 'success', 
        title: 'Ajuste creado', 
        text: `ID ${creado.id} - ${(() => {
          const horas = Number(creado.cantidad_horas);
          return isNaN(horas) ? '0.00' : horas.toFixed(2);
        })()}h` 
      });
      listar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo crear el ajuste';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const eliminarAjuste = async (id: number) => {
    if (!token) return;
    const ok = await Swal.fire({ icon: 'warning', title: 'Eliminar ajuste', text: 'Esta acción no se puede deshacer', showCancelButton: true, confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
    if (!ok.isConfirmed) return;
    try {
      setLoading(true);
      await AjustesHorasService.eliminar(id, token);
      await Swal.fire({ icon: 'success', title: 'Eliminado', text: 'Ajuste eliminado exitosamente' });
      listar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Ajustes de Horas</h1>
            <p className="text-sm text-gray-600">Dar o quitar horas a monitores</p>
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

        <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100 mb-6">
          <h3 className="text-sm font-semibold text-indigo-700 mb-3">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-800">Buscar monitor</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                value={buscaFiltro}
                onChange={(e) => onChangeBusquedaFiltro(e.target.value)}
                placeholder="Nombre o username"
              />
              {(cargandoFiltro || resultadosFiltro.length > 0) && (
                <div className="mt-1 max-h-40 overflow-auto border border-gray-200 rounded">
                  {cargandoFiltro && (
                    <div className="px-3 py-2 text-xs text-gray-500">Buscando...</div>
                  )}
                  {!cargandoFiltro && resultadosFiltro.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onClick={() => { setMonitorId(String(m.id)); setBuscaFiltro(`${m.nombre} (${m.username})`); setResultadosFiltro([]); }}
                    >
                      {m.nombre} (#{m.id}) – {m.username}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-800">Fecha inicio</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-800">Fecha fin</label>
              <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={listar} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">Aplicar</button>
            <button onClick={limpiarFiltros} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">Limpiar</button>
            <button onClick={() => setShowForm(true)} className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">Nuevo ajuste</button>
          </div>
        </div>

        {resumen && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-500">Total ajustes</div>
              <div className="text-lg font-semibold text-gray-900">{resumen.total_ajustes}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-500">Total horas ajustadas</div>
              <div className="text-lg font-semibold text-gray-900">
                {(() => {
                  const horas = Number(resumen.total_horas_ajustadas);
                  return isNaN(horas) ? '0.00' : horas.toFixed(2);
                })()}h
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <div className="text-xs text-gray-500">Monitores afectados</div>
              <div className="text-lg font-semibold text-gray-900">{resumen.monitores_afectados}</div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitor</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ajustes.map(a => (
                  <tr key={a.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{a.usuario.nombre} ({a.usuario.username})</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{a.fecha}</td>
                    <td className={`px-4 py-2 text-sm font-medium ${Number(a.cantidad_horas) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {(() => {
                        const horas = Number(a.cantidad_horas);
                        return isNaN(horas) ? '0.00' : horas.toFixed(2);
                      })()}h
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-700">{a.motivo}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{a.asistencia ? `#${a.asistencia.id} (${a.asistencia.fecha})` : '-'}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => eliminarAjuste(a.id)} className="text-red-600 hover:text-red-800 text-sm">Eliminar</button>
                    </td>
                  </tr>
                ))}
                {ajustes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">No hay resultados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-black">Nuevo ajuste</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-black">Buscar monitor</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black"
                    value={buscaForm}
                    onChange={(e) => onChangeBusquedaForm(e.target.value)}
                    placeholder="Nombre o username"
                  />
                  {(cargandoForm || resultadosForm.length > 0) && (
                    <div className="mt-1 max-h-40 overflow-auto border border-gray-200 rounded">
                      {cargandoForm && (
                        <div className="px-3 py-2 text-xs text-black">Buscando...</div>
                      )}
                      {!cargandoForm && resultadosForm.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm text-black hover:bg-gray-50"
                          onClick={() => { setForm(prev => ({ ...prev, monitor_id: m.id })); setBuscaForm(`${m.nombre} (${m.username})`); setResultadosForm([]); }}
                        >
                          {m.nombre} (#{m.id}) – {m.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-black">Fecha</label>
                    <input type="date" className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" value={form.fecha} onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-black">Horas (+/-)</label>
                    <input type="number" step="0.25" min={-24} max={24} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" value={form.cantidad_horas} onChange={(e) => setForm(prev => ({ ...prev, cantidad_horas: Number(e.target.value) }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-black">Motivo</label>
                  <textarea className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" rows={3} value={form.motivo} onChange={(e) => setForm(prev => ({ ...prev, motivo: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-black">Asistencia relacionada (opcional)</label>
                  <input type="number" className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black" value={form.asistencia_id ?? ''} onChange={(e) => setForm(prev => ({ ...prev, asistencia_id: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
              </div>
              <div className="p-4 border-t flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-black rounded text-sm">Cancelar</button>
                <button onClick={crearAjuste} className="px-4 py-2 bg-green-600 text-white rounded text-sm">Crear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


