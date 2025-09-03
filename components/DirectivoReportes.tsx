'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { ReportesService } from '../services/reportes';
import {
  ReporteHorasQuery,
  ReporteHorasTodosResponse,
  ReporteHorasMonitorResponse,
  MonitorEnReporte,
} from '../types/reportes';
import { todayBogota } from '../utils/date';

export default function DirectivoReportes() {
  const { token } = useAuth();
  const router = useRouter();
  
  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>(todayBogota());
  const [sede, setSede] = useState<'SA' | 'BA' | ''>('');
  const [jornada, setJornada] = useState<'M' | 'T' | ''>('');
  const [monitorSeleccionado, setMonitorSeleccionado] = useState<number | ''>('');
  
  // Estados para datos
  const [loading, setLoading] = useState(false);
  const [reporteTodos, setReporteTodos] = useState<ReporteHorasTodosResponse | null>(null);
  const [reporteMonitor, setReporteMonitor] = useState<ReporteHorasMonitorResponse | null>(null);
  const [vistaActiva, setVistaActiva] = useState<'todos' | 'individual'>('todos');
  const [error, setError] = useState<string | null>(null);

  // Establecer fecha de inicio por defecto (30 días atrás)
  useEffect(() => {
    const fecha30DiasAtras = new Date();
    fecha30DiasAtras.setDate(fecha30DiasAtras.getDate() - 30);
    setFechaInicio(fecha30DiasAtras.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (token && vistaActiva === 'todos') {
      cargarReporteTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cargarReporteTodos = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const query: ReporteHorasQuery = {
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        sede: sede || undefined,
        jornada: jornada || undefined,
      };
      
      const data = await ReportesService.reporteHorasTodos(query, token);
      setReporteTodos(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar el reporte';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteMonitor = async () => {
    if (!token || !monitorSeleccionado) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const query: ReporteHorasQuery = {
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        sede: sede || undefined,
        jornada: jornada || undefined,
      };
      
      const data = await ReportesService.reporteHorasMonitor(Number(monitorSeleccionado), query, token);
      setReporteMonitor(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar el reporte del monitor';
      setError(msg);
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVistaChange = (vista: 'todos' | 'individual') => {
    setVistaActiva(vista);
    setError(null);
    
    if (vista === 'todos') {
      cargarReporteTodos();
    } else {
      setReporteMonitor(null);
    }
  };

  const calcularPorcentajeAsistencia = (presentes: number, total: number) => {
    return total > 0 ? (presentes / total) * 100 : 0;
  };

  const formatearPorcentaje = (valor: number) => `${valor.toFixed(1)}%`;
  const formatearHoras = (horas: number) => `${horas.toFixed(1)}h`;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            📊 Reportes de Asistencias
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Análisis y estadísticas de asistencias de monitores
          </p>
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

      {/* Tabs de navegación */}
      <div className="flex flex-wrap mb-6 border-b border-gray-200">
        {[
          { id: 'todos', label: 'Todos los Monitores', icon: '👥' },
          { id: 'individual', label: 'Monitor Individual', icon: '👤' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleVistaChange(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              vistaActiva === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white/70 backdrop-blur rounded-lg p-4 border border-indigo-100 mb-6">
        <h3 className="text-sm font-semibold text-indigo-700 mb-3">Filtros de Reporte</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Sede</label>
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
            >
              <option value="" className="text-gray-900">Todas</option>
              <option value="SA" className="text-gray-900">San Antonio</option>
              <option value="BA" className="text-gray-900">Barcelona</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-800">Jornada</label>
            <select
              value={jornada}
              onChange={(e) => setJornada(e.target.value as any)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
            >
              <option value="" className="text-gray-900">Todas</option>
              <option value="M" className="text-gray-900">Mañana</option>
              <option value="T" className="text-gray-900">Tarde</option>
            </select>
          </div>
          {vistaActiva === 'individual' && (
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-800">Monitor</label>
              <select
                value={monitorSeleccionado}
                onChange={(e) => setMonitorSeleccionado(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">Seleccionar monitor</option>
                {reporteTodos?.monitores.map((monitor) => (
                  <option key={monitor.monitor.id} value={monitor.monitor.id} className="text-gray-900">
                    {monitor.monitor.nombre} (@{monitor.monitor.username})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-end">
            <button
              onClick={vistaActiva === 'todos' ? cargarReporteTodos : cargarReporteMonitor}
              disabled={loading || (vistaActiva === 'individual' && !monitorSeleccionado)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-sm font-medium"
            >
              {loading ? 'Cargando...' : 'Generar Reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Vista de Todos los Monitores */}
      {vistaActiva === 'todos' && reporteTodos && (
        <div className="space-y-6 bg-transparent">
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-blue-500">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Monitores</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reporteTodos.estadisticas_generales.total_monitores}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Asistencias</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{reporteTodos.estadisticas_generales.total_asistencias}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-purple-500">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Horas</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatearHoras(reporteTodos.estadisticas_generales.total_horas)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Promedio por Monitor</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {formatearHoras(reporteTodos.estadisticas_generales.promedio_horas_por_monitor)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del período */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 text-sm">
                <strong>Período:</strong> {reporteTodos.periodo.fecha_inicio} a {reporteTodos.periodo.fecha_fin}
                {Object.keys(reporteTodos.filtros_aplicados).length > 0 && (
                  <span className="ml-4">
                    <strong>Filtros:</strong> {Object.entries(reporteTodos.filtros_aplicados).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Tabla de estadísticas por monitor */}
          <div className="bg-white border rounded shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Estadísticas por Monitor</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Monitor</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Asistencias</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">% Asistencia</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Autorizadas</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-indigo-700 uppercase">Horas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reporteTodos.monitores.map((monitor: MonitorEnReporte) => {
                    const porcentajeAsistencia = calcularPorcentajeAsistencia(monitor.asistencias_presentes, monitor.total_asistencias);
                    return (
                      <tr key={monitor.monitor.id} className="hover:bg-indigo-50/40">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
                              {monitor.monitor.nombre?.slice(0,1) || 'M'}
                            </span>
                            <span className="text-gray-900 font-medium">{monitor.monitor.nombre} ({monitor.monitor.username})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {monitor.asistencias_presentes}/{monitor.total_asistencias}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            porcentajeAsistencia >= 90 
                              ? 'bg-green-100 text-green-700'
                              : porcentajeAsistencia >= 70
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {formatearPorcentaje(porcentajeAsistencia)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {monitor.asistencias_autorizadas}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatearHoras(monitor.total_horas)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Monitor Individual */}
      {vistaActiva === 'individual' && reporteMonitor && (
        <div className="space-y-6 bg-transparent">
          {/* Información del monitor */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-lg font-medium text-indigo-700">
                  {reporteMonitor.monitor.nombre.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-gray-900">{reporteMonitor.monitor.nombre}</h3>
                <p className="text-gray-600">@{reporteMonitor.monitor.username}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-800 text-sm">
                  <strong>Período:</strong> {reporteMonitor.periodo.fecha_inicio} a {reporteMonitor.periodo.fecha_fin}
                  {Object.keys(reporteMonitor.filtros_aplicados).length > 0 && (
                    <span className="ml-4">
                      <strong>Filtros:</strong> {Object.entries(reporteMonitor.filtros_aplicados).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas del monitor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-purple-500">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{formatearHoras(reporteMonitor.estadisticas.total_horas)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Horas</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-blue-500">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{reporteMonitor.estadisticas.total_asistencias}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Asistencias</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-green-500">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{reporteMonitor.estadisticas.asistencias_presentes}</div>
                <div className="text-xs sm:text-sm text-gray-600">Presentes</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-indigo-500">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-indigo-600">{reporteMonitor.estadisticas.asistencias_autorizadas}</div>
                <div className="text-xs sm:text-sm text-gray-600">Autorizadas</div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md border p-4 sm:p-6 border-l-4 border-yellow-500">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{formatearHoras(reporteMonitor.estadisticas.promedio_horas_por_dia)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Promedio Diario</div>
              </div>
            </div>
          </div>

          {/* Detalle por fecha */}
          <div className="bg-white border rounded shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Detalle de Asistencias por Fecha</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(reporteMonitor.detalle_por_fecha).length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay asistencias para el período seleccionado
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {Object.entries(reporteMonitor.detalle_por_fecha).map(([fecha, asistencias]) => (
                    <div key={fecha} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          {new Date(fecha).toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {asistencias.length} asistencia{asistencias.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {asistencias.map((asistencia) => (
                          <div key={asistencia.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {asistencia.horario.jornada_display} - {asistencia.horario.sede_display}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                ({asistencia.horas}h)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                asistencia.presente 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {asistencia.presente ? 'Presente' : 'Ausente'}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                asistencia.estado_autorizacion === 'autorizado'
                                  ? 'bg-green-100 text-green-800'
                                  : asistencia.estado_autorizacion === 'pendiente'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {asistencia.estado_autorizacion_display}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay datos en vista individual */}
      {vistaActiva === 'individual' && !reporteMonitor && !loading && (
        <div className="bg-white border rounded shadow p-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un Monitor</h3>
          <p className="text-gray-600">
            {!reporteTodos 
              ? 'Primero carga el reporte general para ver la lista de monitores disponibles.'
              : 'Selecciona un monitor del filtro superior para ver su reporte detallado.'
            }
          </p>
          {!reporteTodos && (
            <button
              onClick={() => handleVistaChange('todos')}
              className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded shadow hover:from-indigo-700 hover:to-purple-700 text-sm font-medium"
            >
              Cargar Reporte General
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
