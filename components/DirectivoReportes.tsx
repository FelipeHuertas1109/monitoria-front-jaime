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
import { todayBogota, formatDateFromISO, toBackendDateString } from '../utils/date';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import { validateDataConsistency, ModuleData, ValidationResult } from '../utils/dataValidation';
import DataValidationAlert from './DataValidationAlert';

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const { generatePDF } = usePDFGenerator();

  // Función para validar consistencia de datos
  const validarConsistenciaDatos = async () => {
    if (!reporteMonitor || !token) return;

    try {
      // Obtener datos de finanzas para comparar
      const { FinanzasService } = await import('../services/finanzas');
      const finanzasData = await FinanzasService.reporteFinancieroMonitor(
        reporteMonitor.monitor.id,
        {
          fecha_inicio: reporteMonitor.periodo.fecha_inicio,
          fecha_fin: reporteMonitor.periodo.fecha_fin,
          sede: sede || undefined,
          jornada: jornada || undefined
        },
        token
      );

      // Preparar datos para validación
      const reportesData: ModuleData = {
        horas_trabajadas: reporteMonitor.estadisticas.total_horas,
        horas_asistencias: reporteMonitor.estadisticas.horas_asistencias,
        horas_ajustes: reporteMonitor.estadisticas.horas_ajustes,
        total_asistencias: reporteMonitor.estadisticas.total_asistencias,
        asistencias_presentes: reporteMonitor.estadisticas.asistencias_presentes || 0,
        asistencias_autorizadas: reporteMonitor.estadisticas.asistencias_autorizadas || 0,
        periodo: reporteMonitor.periodo,
        filtros: {
          sede: sede || undefined,
          jornada: jornada || undefined,
          monitor_id: reporteMonitor.monitor.id
        }
      };

      const finanzasModuleData: ModuleData = {
        horas_trabajadas: finanzasData.finanzas_actuales.horas_trabajadas,
        horas_asistencias: finanzasData.finanzas_actuales.horas_asistencias,
        horas_ajustes: finanzasData.finanzas_actuales.horas_ajustes,
        total_asistencias: finanzasData.estadisticas.total_asistencias,
        asistencias_presentes: finanzasData.estadisticas.asistencias_presentes || 0,
        asistencias_autorizadas: finanzasData.estadisticas.asistencias_autorizadas || 0,
        periodo: {
          fecha_inicio: reporteMonitor.periodo.fecha_inicio,
          fecha_fin: reporteMonitor.periodo.fecha_fin
        },
        filtros: {
          sede: sede || undefined,
          jornada: jornada || undefined,
          monitor_id: reporteMonitor.monitor.id
        }
      };

      // Validar consistencia
      const result = validateDataConsistency(reportesData, finanzasModuleData);
      setValidationResult(result);

    } catch (error) {
      console.error('Error al validar consistencia de datos:', error);
      setValidationResult({
        isValid: false,
        discrepancies: [{
          type: 'hours',
          module: 'finanzas',
          field: 'validation_error',
          expectedValue: 0,
          actualValue: 0,
          difference: 0,
          description: 'Error al obtener datos de finanzas para validación'
        }],
        warnings: []
      });
    }
  };

  // Establecer fecha de inicio por defecto (6 meses atrás)
  useEffect(() => {
    const fecha6MesesAtras = new Date();
    fecha6MesesAtras.setMonth(fecha6MesesAtras.getMonth() - 6);
    setFechaInicio(fecha6MesesAtras.toISOString().split('T')[0]);
  }, []);

  // Cargar reporte cuando hay token y los filtros están listos
  useEffect(() => {
    if (token && vistaActiva === 'todos' && fechaInicio) {
      cargarReporteTodos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, fechaInicio]);

  const cargarReporteTodos = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const query: ReporteHorasQuery = {
        fecha_inicio: fechaInicio ? toBackendDateString(fechaInicio) : undefined,
        fecha_fin: fechaFin ? toBackendDateString(fechaFin) : undefined,
        sede: sede || undefined,
        jornada: jornada || undefined,
      };
      
      console.log('🔍 Filtros aplicados al reporte:', {
        fecha_inicio: query.fecha_inicio,
        fecha_fin: query.fecha_fin,
        sede: query.sede || 'Todas',
        jornada: query.jornada || 'Todas',
      });
      
      const data = await ReportesService.reporteHorasTodos(query, token);
      console.log('✅ Datos del reporte todos recibidos:', data);
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
        fecha_inicio: fechaInicio ? toBackendDateString(fechaInicio) : undefined,
        fecha_fin: fechaFin ? toBackendDateString(fechaFin) : undefined,
        sede: sede || undefined,
        jornada: jornada || undefined,
      };
      
      console.log('🔍 Filtros aplicados al reporte individual:', {
        monitor_id: monitorSeleccionado,
        fecha_inicio: query.fecha_inicio,
        fecha_fin: query.fecha_fin,
        sede: query.sede || 'Todas',
        jornada: query.jornada || 'Todas',
      });
      
      const data = await ReportesService.reporteHorasMonitor(Number(monitorSeleccionado), query, token);
      console.log('✅ Datos del reporte individual recibidos:', data);
      setReporteMonitor(data);
      
      // Validar consistencia automáticamente después de cargar
      setTimeout(() => {
        validarConsistenciaDatos();
      }, 1000);
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

  const calcularHorasProgramadas = (asistencias: any[], totalAsistencias?: number, horasTrabajadas?: number): number => {
    console.log('🔍 calcularHorasProgramadas llamado con:', {
      asistencias_length: asistencias?.length || 0,
      totalAsistencias,
      horasTrabajadas
    });
    
    // Si tenemos el array de asistencias con horas, calcular directamente
    if (asistencias && Array.isArray(asistencias) && asistencias.length > 0) {
      const total = asistencias.reduce((total, asistencia) => {
        const horas = typeof asistencia?.horas === 'number' ? asistencia.horas : 0;
        return total + horas;
      }, 0);
      
      if (total > 0) {
        console.log('✅ Horas programadas calculadas desde array:', total);
        return total;
      }
      
      // Si el array tiene elementos pero la suma es 0, calcular promedio
      if (asistencias.length > 0 && totalAsistencias && totalAsistencias > 0) {
        const horasPromedio = total / asistencias.length;
        if (horasPromedio > 0) {
          const horasProgramadas = horasPromedio * totalAsistencias;
          console.log('📊 Horas programadas estimadas (promedio del array):', horasProgramadas);
          return horasProgramadas;
        }
      }
    }
    
    // Si tenemos totalAsistencias, calcular basándose en horas trabajadas o valor por defecto
    if (totalAsistencias && totalAsistencias > 0) {
      // Si tenemos horas trabajadas, calcular el promedio por asistencia presente
      if (horasTrabajadas && horasTrabajadas > 0 && asistencias && Array.isArray(asistencias) && asistencias.length > 0) {
        // Calcular promedio basado en asistencias presentes
        const asistenciasPresentes = asistencias.filter(a => a?.presente === true).length;
        if (asistenciasPresentes > 0) {
          const horasPorAsistencia = horasTrabajadas / asistenciasPresentes;
          const horasProgramadas = horasPorAsistencia * totalAsistencias;
          console.log('📊 Horas programadas estimadas (promedio de presentes):', horasProgramadas, 'horas/asis:', horasPorAsistencia);
          return horasProgramadas;
        }
      }
      
      // Si no tenemos datos suficientes, usar un promedio estándar
      // Calcular basándose en las horas trabajadas si están disponibles
      if (horasTrabajadas && horasTrabajadas > 0) {
        // Estimar que cada asistencia tiene aproximadamente las mismas horas
        // Usar el promedio de horas trabajadas por asistencia presente
        const asistenciasPresentes = asistencias?.filter(a => a?.presente === true).length || 1;
        const horasPorAsistencia = horasTrabajadas / asistenciasPresentes;
        const horasProgramadas = horasPorAsistencia * totalAsistencias;
        console.log('📊 Horas programadas estimadas (promedio trabajadas):', horasProgramadas, 'horas/asis:', horasPorAsistencia);
        return horasProgramadas;
      }
      
      // Último recurso: usar valor por defecto de 4 horas por asistencia
      const horasPorAsistencia = 4;
      const horasProgramadas = horasPorAsistencia * totalAsistencias;
      console.log('📊 Horas programadas estimadas (default 4h):', horasProgramadas);
      return horasProgramadas;
    }
    
    console.log('⚠️ No se pudo calcular horas programadas - faltan datos');
    return 0;
  };

  const formatearPorcentaje = (valor: number) => `${valor.toFixed(1)}%`;
  const formatearCumplimiento = (valor: number) => `${Math.round(valor)}%`;
  const formatearHoras = (horas: number) => `${horas.toFixed(1)}h`;
  const formatearHorasConProgramadas = (trabajadas: number, programadas: number) => {
    const trabajadasNum = typeof trabajadas === 'number' && !isNaN(trabajadas) ? trabajadas : 0;
    const programadasNum = typeof programadas === 'number' && !isNaN(programadas) ? programadas : 0;
    return `${trabajadasNum.toFixed(1)}h / ${programadasNum.toFixed(1)}h`;
  };

  const handlePrintPDF = async () => {
    try {
      const elementId = vistaActiva === 'todos' ? 'reporte-todos' : 'reporte-individual';
      const title = vistaActiva === 'todos' 
        ? 'Reporte de Asistencias - Todos los Monitores'
        : `Reporte de Asistencias - ${reporteMonitor?.monitor.nombre || 'Monitor'}`;
      
      // Crear nombre de archivo con nombre del usuario
      let filename = `reporte-asistencias-${vistaActiva}-${new Date().toISOString().split('T')[0]}.pdf`;
      if (vistaActiva === 'individual' && reporteMonitor?.monitor.nombre) {
        const userName = reporteMonitor.monitor.nombre.toLowerCase().replace(/\s+/g, '-');
        filename = `reporte-asistencias-${userName}-${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      // Preparar datos del reporte para el PDF
      const reportData = vistaActiva === 'todos' && reporteTodos ? {
        monitores: reporteTodos.monitores.map(monitor => {
          console.log(`📋 Analizando monitor ${monitor.monitor.nombre}:`, {
            total_horas: monitor.total_horas,
            total_asistencias: monitor.total_asistencias,
            asistencias_presentes: monitor.asistencias_presentes,
            asistencias_array_length: monitor.asistencias?.length || 0,
            primera_asistencia: monitor.asistencias?.[0] ? {
              id: monitor.asistencias[0].id,
              horas: monitor.asistencias[0].horas,
              presente: monitor.asistencias[0].presente
            } : null
          });
          
          const horasProgramadas = calcularHorasProgramadas(
            monitor.asistencias || [], 
            monitor.total_asistencias,
            monitor.total_horas
          );
          
          console.log(`✅ ${monitor.monitor.nombre} - Horas programadas calculadas:`, horasProgramadas);
          
          return {
            nombre: monitor.monitor.nombre,
            username: monitor.monitor.username,
            asistencias_presentes: monitor.asistencias_presentes,
            total_asistencias: monitor.total_asistencias,
            total_horas: monitor.total_horas,
            horas_programadas: horasProgramadas
          };
        })
      } : undefined;
      
      console.log('📄 Datos del reporte preparados para PDF:', reportData);
      
      await generatePDF(elementId, {
        filename,
        title,
        orientation: 'landscape',
        userName: vistaActiva === 'individual' ? reporteMonitor?.monitor.nombre : undefined,
        reportData
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al generar PDF';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
      {/* Header con diseño moderno */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl shadow-xl p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              📊 Reportes de Asistencias
            </h1>
            <p className="text-blue-100 text-lg">
              Análisis y estadísticas detalladas de asistencias de monitores
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrintPDF}
              disabled={loading || (!reporteTodos && !reporteMonitor)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden sm:inline">Imprimir PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl transition-all duration-200 border border-white/20 text-sm font-semibold transform hover:scale-105"
            >
              <svg 
                className="w-5 h-5" 
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

      {/* Validación de datos */}
      {vistaActiva === 'individual' && reporteMonitor && (
        <DataValidationAlert 
          validationResult={validationResult}
          onRefresh={validarConsistenciaDatos}
        />
      )}

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
        <div id="reporte-todos" className="space-y-6 bg-transparent">
          {/* Indicador de filtros aplicados */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h4 className="text-sm font-semibold text-blue-900">Filtros Aplicados</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Período: </span>
                <span className="text-blue-900">
                  {reporteTodos.periodo.fecha_inicio ? formatDateFromISO(reporteTodos.periodo.fecha_inicio) : 'Sin definir'} - {reporteTodos.periodo.fecha_fin ? formatDateFromISO(reporteTodos.periodo.fecha_fin) : 'Sin definir'}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Sede: </span>
                <span className="text-blue-900">
                  {reporteTodos.filtros_aplicados?.sede === 'SA' ? 'San Antonio' : 
                   reporteTodos.filtros_aplicados?.sede === 'BA' ? 'Barcelona' : 'Todas'}
                </span>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Jornada: </span>
                <span className="text-blue-900">
                  {reporteTodos.filtros_aplicados?.jornada === 'M' ? 'Mañana' : 
                   reporteTodos.filtros_aplicados?.jornada === 'T' ? 'Tarde' : 'Todas'}
                </span>
              </div>
            </div>
          </div>
          {/* Estadísticas generales con diseño PowerBI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Monitores */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Monitores</p>
                  <p className="text-3xl font-bold">{reporteTodos.estadisticas_generales.total_monitores}</p>
                </div>
                <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Asistencias */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Asistencias</p>
                  <p className="text-3xl font-bold">{reporteTodos.estadisticas_generales.total_asistencias}</p>
                </div>
                <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Horas */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Horas</p>
                  <p className="text-2xl font-bold">{formatearHoras(reporteTodos.estadisticas_generales.total_horas)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Promedio por Monitor */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Promedio por Monitor</p>
                  <p className="text-2xl font-bold">{formatearHoras(reporteTodos.estadisticas_generales.promedio_horas_por_monitor)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>


          {/* Tabla de estadísticas por monitor con diseño moderno */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
              <h3 className="text-xl font-bold text-white">Rendimiento de Monitores</h3>
              <p className="text-blue-100 text-sm mt-1">Análisis detallado de asistencias y rendimiento por monitor</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Asistencias</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Progreso</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Autorizadas</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Horas</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporteTodos.monitores.map((monitor: MonitorEnReporte) => {
                    const porcentajeAsistencia = calcularPorcentajeAsistencia(monitor.asistencias_presentes, monitor.total_asistencias);
                    return (
                      <tr key={monitor.monitor.id} className="hover:bg-blue-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {monitor.monitor.nombre?.slice(0,1) || 'M'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{monitor.monitor.nombre}</div>
                              <div className="text-sm text-gray-500">@{monitor.monitor.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Presentes:</span>
                              <span className="text-sm font-semibold text-green-600">
                                {monitor.asistencias_presentes}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Total:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {monitor.total_asistencias}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-3">
                            {/* Barra de progreso */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Progreso de Asistencia</span>
                                <span className="font-semibold text-blue-600">
                                  {monitor.asistencias_presentes}/{monitor.total_asistencias}
                                </span>
                              </div>
                              
                              {/* Barra de progreso */}
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    porcentajeAsistencia >= 90 
                                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                                      : porcentajeAsistencia >= 70
                                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                      : 'bg-gradient-to-r from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${Math.min(porcentajeAsistencia, 100)}%` }}
                                ></div>
                              </div>
                              
                              {/* Porcentaje debajo de la barra */}
                              <div className="text-center">
                                <span className={`text-xs font-semibold ${
                                  porcentajeAsistencia >= 90 
                                    ? 'text-green-700'
                                    : porcentajeAsistencia >= 70
                                    ? 'text-yellow-700'
                                    : 'text-red-700'
                                }`}>
                                  {formatearPorcentaje(porcentajeAsistencia)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${
                                monitor.asistencias_autorizadas > 0 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                              }`}></div>
                            </div>
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                {monitor.asistencias_autorizadas}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatearHorasConProgramadas(
                                monitor.total_horas || 0, 
                                calcularHorasProgramadas(
                                  monitor.asistencias || [], 
                                  monitor.total_asistencias,
                                  monitor.total_horas
                                )
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Trabajadas / Programadas
                            </div>
                          </div>
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
        <div id="reporte-individual" className="space-y-8 bg-transparent">
          {/* Indicador de filtros aplicados */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h4 className="text-sm font-semibold text-indigo-900">Filtros Aplicados</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-indigo-700 font-medium">Período: </span>
                <span className="text-indigo-900">
                  {reporteMonitor.periodo.fecha_inicio ? formatDateFromISO(reporteMonitor.periodo.fecha_inicio) : 'Sin definir'} - {reporteMonitor.periodo.fecha_fin ? formatDateFromISO(reporteMonitor.periodo.fecha_fin) : 'Sin definir'}
                </span>
              </div>
              <div>
                <span className="text-indigo-700 font-medium">Sede: </span>
                <span className="text-indigo-900">
                  {reporteMonitor.filtros_aplicados?.sede === 'SA' ? 'San Antonio' : 
                   reporteMonitor.filtros_aplicados?.sede === 'BA' ? 'Barcelona' : 'Todas'}
                </span>
              </div>
              <div>
                <span className="text-indigo-700 font-medium">Jornada: </span>
                <span className="text-indigo-900">
                  {reporteMonitor.filtros_aplicados?.jornada === 'M' ? 'Mañana' : 
                   reporteMonitor.filtros_aplicados?.jornada === 'T' ? 'Tarde' : 'Todas'}
                </span>
              </div>
            </div>
          </div>
          {/* Información del monitor con diseño moderno */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {reporteMonitor.monitor.nombre.charAt(0)}
                </span>
              </div>
              <div className="ml-6">
                <h3 className="text-3xl font-bold">{reporteMonitor.monitor.nombre}</h3>
                <p className="text-indigo-100 text-lg">@{reporteMonitor.monitor.username}</p>
                <p className="text-indigo-200 text-sm mt-1">Reporte detallado de asistencias</p>
              </div>
            </div>
          </div>

          {/* Gráfica circular de progreso */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfica de Progreso Circular */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Progreso de Asistencia</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Círculo de fondo */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Círculo de progreso */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradientAsistencia)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - calcularPorcentajeAsistencia(reporteMonitor.estadisticas.asistencias_presentes, reporteMonitor.estadisticas.total_asistencias) / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradientAsistencia" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatearCumplimiento(calcularPorcentajeAsistencia(reporteMonitor.estadisticas.asistencias_presentes, reporteMonitor.estadisticas.total_asistencias))}
                      </div>
                      <div className="text-sm text-gray-600">Cumplimiento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicadores de Rendimiento */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Indicadores de Rendimiento</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Asistencias Presentes</p>
                      <p className="text-lg font-bold text-gray-900">{reporteMonitor.estadisticas.asistencias_presentes}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Horas</p>
                      <p className="text-lg font-bold text-gray-900">{formatearHoras(reporteMonitor.estadisticas.total_horas)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Asistencias Autorizadas</p>
                      <p className="text-lg font-bold text-gray-900">{reporteMonitor.estadisticas.asistencias_autorizadas}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas del monitor con diseño PowerBI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total Horas */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Horas</p>
                  <p className="text-2xl font-bold">{formatearHoras(reporteMonitor.estadisticas.total_horas)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Asistencias */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Asistencias</p>
                  <p className="text-2xl font-bold">{reporteMonitor.estadisticas.total_asistencias}</p>
                </div>
                <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Presentes */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Presentes</p>
                  <p className="text-2xl font-bold">{reporteMonitor.estadisticas.asistencias_presentes}</p>
                </div>
                <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Autorizadas */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Autorizadas</p>
                  <p className="text-2xl font-bold">{reporteMonitor.estadisticas.asistencias_autorizadas}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cumplimiento con gráfica circular */}
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Cumplimiento</p>
                  <p className="text-2xl font-bold">
                    {formatearCumplimiento(calcularPorcentajeAsistencia(reporteMonitor.estadisticas.asistencias_presentes, reporteMonitor.estadisticas.total_asistencias))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-400 bg-opacity-30 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Detalle por fecha con diseño moderno */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700">
              <h3 className="text-xl font-bold text-white">Detalle de Asistencias por Fecha</h3>
              <p className="text-gray-100 text-sm mt-1">Historial detallado de asistencias del monitor</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {Object.entries(reporteMonitor.detalle_por_fecha).length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay asistencias</h4>
                  <p className="text-gray-500">No se encontraron asistencias para el período seleccionado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {Object.entries(reporteMonitor.detalle_por_fecha).map(([fecha, asistencias]) => (
                    <div key={fecha} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatDateFromISO(fecha)}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {asistencias.length} asistencia{asistencias.length !== 1 ? 's' : ''} registrada{asistencias.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {asistencias.map((asistencia) => (
                          <div key={asistencia.id} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <span className="text-sm font-semibold text-gray-900">
                                  {asistencia.horario.jornada_display} - {asistencia.horario.sede_display}
                                </span>
                                <div className="flex items-center mt-1">
                                  <span className="text-xs text-gray-500 mr-2">
                                    {asistencia.horas}h trabajadas
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                asistencia.presente 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  asistencia.presente ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                                {asistencia.presente ? 'Presente' : 'Ausente'}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                asistencia.estado_autorizacion === 'autorizado'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : asistencia.estado_autorizacion === 'pendiente'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  asistencia.estado_autorizacion === 'autorizado' ? 'bg-green-500' :
                                  asistencia.estado_autorizacion === 'pendiente' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>
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
