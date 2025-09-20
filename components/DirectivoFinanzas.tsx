'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { FinanzasService } from '@/services/finanzas';
import { 
  ResumenEjecutivo, 
  ReporteFinancieroTodos, 
  ReporteFinancieroMonitor, 
  ComparativaSemanas, 
  Configuracion,
  FinanzasQuery 
} from '@/types/finanzas';

export default function DirectivoFinanzas() {
  const { token } = useAuth();
  const router = useRouter();
  
  // Estados principales
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'configuraciones'>('resumen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [servicioDisponible, setServicioDisponible] = useState(true);
  
  // Estados de datos
  const [resumenEjecutivo, setResumenEjecutivo] = useState<ResumenEjecutivo | null>(null);
  const [reporteTodos, setReporteTodos] = useState<ReporteFinancieroTodos | null>(null);
  const [reporteMonitor, setReporteMonitor] = useState<ReporteFinancieroMonitor | null>(null);
  const [comparativaSemanas, setComparativaSemanas] = useState<ComparativaSemanas | null>(null);
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [totalHoras, setTotalHoras] = useState<any>(null);
  
  // Estados de filtros
  const [query, setQuery] = useState<FinanzasQuery>({
    fecha_inicio: '2025-03-20',
    fecha_fin: '2025-09-20',
    semanas_trabajadas: 8
  });
  
  // Estados de diagnóstico
  const [endpointsStatus, setEndpointsStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  // Cargar datos iniciales
  useEffect(() => {
    console.log('DirectivoFinanzas - useEffect ejecutado, token:', token ? 'presente' : 'ausente');
    if (token) {
      console.log('DirectivoFinanzas - Iniciando carga de datos...');
      cargarResumenEjecutivo();
      cargarTodosMonitores();
      cargarTotalHoras();
      cargarConfiguraciones();
    } else {
      console.log('DirectivoFinanzas - No hay token, no se cargan datos');
    }
  }, [token]);

  // Función para cargar resumen ejecutivo
  const cargarResumenEjecutivo = async () => {
    if (!token) {
      console.log('DirectivoFinanzas - cargarResumenEjecutivo: No hay token');
      return;
    }
    
    console.log('DirectivoFinanzas - cargarResumenEjecutivo: Iniciando con query:', query);
    setLoading(true);
    setError(null);
    
    try {
      const data = await FinanzasService.resumenEjecutivo(query, token);
      console.log('DirectivoFinanzas - cargarResumenEjecutivo: Datos recibidos:', data);
      setResumenEjecutivo(data);
      setServicioDisponible(true);
      setError(null); // Limpiar errores previos
      console.log('DirectivoFinanzas - Servicio activado, datos cargados exitosamente');
    } catch (error) {
      console.error('DirectivoFinanzas - Error al cargar resumen ejecutivo:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      
      if (error instanceof Error && error.message.includes('500')) {
        setServicioDisponible(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar configuraciones
  const cargarConfiguraciones = async () => {
    if (!token) return;
    
    try {
      const data = await FinanzasService.listarConfiguraciones(token);
      console.log('Configuraciones del backend:', data.configuraciones);
      setConfiguraciones(data.configuraciones);
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      // Usar configuraciones por defecto si falla
      setConfiguraciones([
        { 
          id: 1, 
          clave: 'costo_por_hora', 
          valor: '9965', 
          valor_tipado: 9965,
          descripcion: 'Costo por hora en COP', 
          tipo_dato: 'entero',
          creado_por: { id: 1, username: 'sistema', nombre: 'Sistema' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 2, 
          clave: 'semanas_semestre', 
          valor: '14', 
          valor_tipado: 14,
          descripcion: 'Número de semanas del semestre', 
          tipo_dato: 'entero',
          creado_por: { id: 1, username: 'sistema', nombre: 'Sistema' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    }
  };

  // Función para cargar todos los monitores
  const cargarTodosMonitores = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await FinanzasService.reporteFinancieroTodos(query, token);
      setReporteTodos(data);
    } catch (error) {
      console.error('Error al cargar todos los monitores:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos de todos los monitores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar monitor individual
  const cargarMonitorIndividual = async (monitorId: number) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await FinanzasService.reporteFinancieroMonitor(monitorId, query, token);
      setReporteMonitor(data);
    } catch (error) {
      console.error('Error al cargar monitor individual:', error);
      Swal.fire('Error', 'No se pudo cargar el reporte del monitor', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar comparativa de semanas
  const cargarComparativaSemanas = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await FinanzasService.comparativaSemanas(token);
      setComparativaSemanas(data);
    } catch (error) {
      console.error('Error al cargar comparativa de semanas:', error);
      Swal.fire('Error', 'No se pudo cargar la comparativa de semanas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar total de horas
  const cargarTotalHoras = async (sede?: string, jornada?: string, monitorId?: number) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await FinanzasService.totalHorasHorarios(token, sede, jornada, monitorId);
      setTotalHoras(data);
    } catch (error) {
      console.error('Error al cargar total de horas:', error);
      Swal.fire('Error', 'No se pudo cargar el total de horas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para probar endpoints
  const probarEndpoints = async () => {
    if (!token) return;
    
    const endpoints = [
      { name: 'Configuraciones', test: () => FinanzasService.listarConfiguraciones(token) },
      { name: 'Comparativa Semanas', test: () => FinanzasService.comparativaSemanas(token) },
      { name: 'Resumen Ejecutivo', test: () => FinanzasService.resumenEjecutivo(query, token) },
    ];

    setEndpointsStatus({});
    
    for (const endpoint of endpoints) {
      setEndpointsStatus(prev => ({ ...prev, [endpoint.name]: 'pending' }));
      
      try {
        await endpoint.test();
        setEndpointsStatus(prev => ({ ...prev, [endpoint.name]: 'success' }));
      } catch (e) {
        console.error(`Error en ${endpoint.name}:`, e);
        setEndpointsStatus(prev => ({ ...prev, [endpoint.name]: 'error' }));
      }
    }
  };

  // Función para activar modo demostración
  const activarModoDemostracion = () => {
    setServicioDisponible(true);
    setError(null);
    console.log("Modo demostración activado - usando datos del backend");
  };

  // Función para abrir modal de configuración
  const abrirModalConfiguracion = async (config: Configuracion) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar ${config.clave}`,
      html: `
        <div class="text-left">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Valor:</label>
            <input id="valor" type="${config.tipo_dato === 'entero' ? 'number' : config.tipo_dato === 'decimal' ? 'number' : 'text'}" 
                   value="${config.valor}" 
                   class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400">
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Descripción:</label>
            <textarea id="descripcion" 
                      class="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400" 
                      rows="3">${config.descripcion}</textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const valor = (document.getElementById('valor') as HTMLInputElement)?.value;
        const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement)?.value;
        
        if (!valor) {
          Swal.showValidationMessage('El valor es requerido');
          return false;
        }
        
        return { valor, descripcion };
      }
    });

    if (formValues) {
      try {
        setLoading(true);
        
        // Actualizar en el backend usando la clave
        await FinanzasService.actualizarConfiguracion(config.clave, {
          clave: config.clave,
          valor: formValues.valor,
          descripcion: formValues.descripcion,
          tipo_dato: config.tipo_dato
        }, token!);
        
        // Recargar configuraciones
        await cargarConfiguraciones();
        
        Swal.fire('¡Actualizado!', 'La configuración ha sido actualizada correctamente', 'success');
      } catch (error) {
        console.error('Error al actualizar configuración:', error);
        Swal.fire('Error', 'No se pudo actualizar la configuración', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para formatear moneda
  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  // Función para formatear horas
  const formatearHoras = (horas: number) => {
    return `${horas.toFixed(1)}h`;
  };

  // Función para formatear porcentaje
  const formatearPorcentaje = (porcentaje: number) => {
    return `${porcentaje.toFixed(1)}%`;
  };

  // Función para calcular el progreso real de un monitor
  const calcularProgresoReal = (monitor: any) => {
    if (!totalHoras || !totalHoras.monitores) {
      return monitor.proyeccion_semestre.porcentaje_completado;
    }

    // Buscar el monitor en los datos de total horas
    const monitorTotalHoras = totalHoras.monitores.find((m: any) => m.monitor.id === monitor.monitor.id);
    
    if (!monitorTotalHoras) {
      return monitor.proyeccion_semestre.porcentaje_completado;
    }

    // Calcular progreso real: (horas trabajadas / horas totales del semestre) * 100
    const horasTrabajadas = monitor.finanzas_actuales.horas_trabajadas;
    const horasTotalesSemestre = monitorTotalHoras.horas_semestre;
    
    if (horasTotalesSemestre === 0) {
      return 0;
    }

    const progresoReal = (horasTrabajadas / horasTotalesSemestre) * 100;
    return Math.min(progresoReal, 100); // Máximo 100%
  };

  // Función para generar reporte
  const generarReporte = () => {
    switch (vistaActiva) {
      case 'resumen':
        cargarResumenEjecutivo();
        break;
      case 'configuraciones':
        cargarConfiguraciones();
        break;
      default:
        break;
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">Necesitas iniciar sesión para acceder a esta sección.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md border p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Gestión Financiera</h2>
          <p className="text-gray-600 mb-6">Análisis financiero y proyecciones de costos de monitores</p>

          {/* Navegación */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setVistaActiva('resumen')}
              className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 ${
                vistaActiva === 'resumen' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 shadow-md hover:shadow-lg'
              }`}
            >
              📊 Dashboard Ejecutivo
            </button>
            <button
              onClick={() => setVistaActiva('configuraciones')}
              className={`px-6 py-3 rounded-lg text-lg font-semibold transition-all duration-200 ${
                vistaActiva === 'configuraciones' 
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg transform scale-105' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-800 shadow-md hover:shadow-lg'
              }`}
            >
              ⚙️ Configuraciones
            </button>
            <button
              onClick={() => {
                console.log('Configuraciones actuales:', configuraciones);
                const costoPorHora = configuraciones.find(c => c.clave === 'costo_por_hora')?.valor_tipado || 9965;
                const semanasSemestre = configuraciones.find(c => c.clave === 'semanas_semestre')?.valor_tipado || 14;
                console.log(`Costo por hora: $${costoPorHora}`);
                console.log(`Semanas del semestre: ${semanasSemestre}`);
                const costoCalculado = 8 * Number(semanasSemestre) * Number(costoPorHora);
                const semanasBackend = Math.round(2232160 / (8 * Number(costoPorHora)));
                console.log(`Ejemplo cálculo Juan Pablo: 8 horas × ${semanasSemestre} semanas × $${costoPorHora} = $${costoCalculado}`);
                Swal.fire({
                  title: 'Configuración de Costos',
                  html: `
                    <div class="text-left">
                      <p><strong>Costo por Hora:</strong> $${Number(costoPorHora).toLocaleString()}</p>
                      <p><strong>Semanas del Semestre:</strong> ${semanasSemestre}</p>
                      <hr class="my-3">
                      <p><strong>Ejemplo Juan Pablo:</strong></p>
                      <p>8 horas × ${semanasSemestre} semanas × $${costoPorHora} = <strong>$${costoCalculado.toLocaleString()}</strong></p>
                      <p class="text-sm text-gray-600 mt-2">El valor mostrado ($2,232,160) sugiere que el backend usa ${semanasBackend} semanas</p>
                    </div>
                  `,
                  icon: 'info'
                });
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium"
              title="Debug: Ver configuración de costos"
            >
              ⚙️
            </button>
            <button
              onClick={() => {
                if (reporteTodos && reporteTodos.monitores.length > 0) {
                  const primerMonitor = reporteTodos.monitores[0];
                  const horasTrabajadas = primerMonitor.finanzas_actuales.horas_trabajadas;
                  const horasProyectadas = primerMonitor.proyeccion_semestre.horas_totales_proyectadas;
                  const porcentajeCompletado = primerMonitor.proyeccion_semestre.porcentaje_completado;
                  const progresoReal = calcularProgresoReal(primerMonitor);
                  
                  // Buscar datos de total horas
                  const monitorTotalHoras = totalHoras?.monitores?.find((m: any) => m.monitor.id === primerMonitor.monitor.id);
                  
                  console.log('Análisis del % Completado:', {
                    monitor: primerMonitor.monitor.nombre,
                    horasTrabajadas,
                    horasProyectadas,
                    horasTotalesSemestre: monitorTotalHoras?.horas_semestre || 'No disponible',
                    porcentajeCompletado,
                    progresoReal,
                    calculoManual: (horasTrabajadas / horasProyectadas) * 100
                  });
                  
                  const horasTotalesSemestre = monitorTotalHoras?.horas_semestre || 0;
                  const horasFaltantes = Math.max(0, horasTotalesSemestre - horasTrabajadas);
                  
                  Swal.fire({
                    title: 'Análisis Detallado del Progreso',
                    html: `
                      <div class="text-left">
                        <p><strong>Monitor:</strong> ${primerMonitor.monitor.nombre}</p>
                        <hr class="my-3">
                        
                        <div class="bg-blue-50 p-3 rounded-lg mb-3">
                          <h4 class="font-semibold text-blue-800 mb-2">📊 Horas del Semestre</h4>
                          <p><strong>Horas Trabajadas:</strong> <span class="text-green-600 font-semibold">${horasTrabajadas}h</span></p>
                          <p><strong>Horas Totales Semestre:</strong> <span class="text-blue-600 font-semibold">${horasTotalesSemestre}h</span></p>
                          <p><strong>Horas Faltantes:</strong> <span class="text-orange-600 font-semibold">${horasFaltantes}h</span></p>
                        </div>
                        
                        <div class="bg-gray-50 p-3 rounded-lg mb-3">
                          <h4 class="font-semibold text-gray-800 mb-2">📈 Comparación de Progreso</h4>
                          <p><strong>% Progreso Real:</strong> <span class="text-blue-600 font-semibold">${progresoReal.toFixed(1)}%</span></p>
                          <p><strong>% Backend (Proyectado):</strong> <span class="text-gray-600">${porcentajeCompletado.toFixed(1)}%</span></p>
                          <p><strong>Diferencia:</strong> <span class="text-red-600">${(progresoReal - porcentajeCompletado).toFixed(1)}%</span></p>
                        </div>
                        
                        <div class="bg-green-50 p-3 rounded-lg">
                          <h4 class="font-semibold text-green-800 mb-2">🎯 Estado del Monitor</h4>
                          <p><strong>Progreso:</strong> ${progresoReal >= 100 ? '✅ Completado' : 
                                                      progresoReal >= 80 ? '🟢 Casi listo' : 
                                                      progresoReal >= 60 ? '🟡 En progreso' : 
                                                      progresoReal >= 40 ? '🟠 Iniciando' : '🔴 Pendiente'}</p>
                          <p><strong>Fórmula Real:</strong> (${horasTrabajadas}h ÷ ${horasTotalesSemestre}h) × 100 = ${progresoReal.toFixed(1)}%</p>
                        </div>
                      </div>
                    `,
                    icon: 'info',
                    width: '600px'
                  });
                } else {
                  Swal.fire('Info', 'No hay datos de monitores disponibles', 'info');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
              title="Debug: Analizar % Completado"
            >
              📊
            </button>
            <button
              onClick={async () => {
                try {
                  // Probar endpoint de configuraciones
                  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/directivo/configuraciones/`, {
                    method: 'GET',
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    mode: 'cors',
                  });
                  
                  console.log('Status configuraciones:', response.status);
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('Configuraciones del backend:', data);
                    
                    // Probar endpoint de actualización por clave
                    let testResponseStatus = 'No disponible';
                    
                    const testResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/directivo/configuraciones/costo_por_hora/`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                      },
                      mode: 'cors',
                      body: JSON.stringify({ 
                        clave: 'costo_por_hora',
                        valor: '9965', 
                        descripcion: 'Costo por hora de trabajo de los monitores en pesos colombianos (COP) - Test',
                        tipo_dato: 'decimal'
                      }),
                    });
                    
                    testResponseStatus = `${testResponse.status} ${testResponse.ok ? '✅' : '❌'}`;
                    console.log('Status actualización por clave:', testResponse.status);
                    
                    Swal.fire({
                      title: 'Prueba de Endpoints',
                      html: `
                        <div class="text-left">
                          <p><strong>GET /directivo/configuraciones/:</strong> ${response.status} ${response.ok ? '✅' : '❌'}</p>
                          <p><strong>PUT /directivo/configuraciones/costo_por_hora/:</strong> ${testResponseStatus}</p>
                          <hr class="my-3">
                          <p class="text-sm text-gray-600">Usando endpoints por clave (nombre)</p>
                        </div>
                      `,
                      icon: response.ok ? 'success' : 'error'
                    });
                  } else {
                    throw new Error(`Error ${response.status}`);
                  }
                } catch (error) {
                  console.error('Error en prueba de endpoints:', error);
                  Swal.fire('Error', `Error al probar endpoints: ${error}`, 'error');
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded text-sm font-medium"
              title="Probar endpoints de configuraciones"
            >
              🔧
            </button>
          </div>


          {/* Vista de servicio no disponible */}
          {!servicioDisponible && (
            <div className="space-y-6">
              {/* Alerta de servicio no disponible */}
              <div className="bg-white border rounded shadow p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Servicio de Finanzas No Disponible</h3>
                <p className="text-gray-600 mb-4">
                  Los endpoints de finanzas no están disponibles en este momento. Esto puede deberse a:
                </p>
                <ul className="text-left text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  <li>• Los endpoints aún no han sido implementados en el backend</li>
                  <li>• Hay un problema temporal con el servidor</li>
                  <li>• El servicio está en mantenimiento</li>
                </ul>
                
                {/* Información de diagnóstico */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-gray-900 mb-2">Información de Diagnóstico:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>URL Base:</strong> {process.env.NEXT_PUBLIC_BACKEND_URL || 'No configurada'}</p>
                    <p><strong>Token:</strong> {token ? 'Presente' : 'No disponible'}</p>
                    <p><strong>Error:</strong> {error || 'No especificado'}</p>
                    <p><strong>Estado:</strong> Error 500 - Internal Server Error</p>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Problema Identificado:</p>
                    <p className="text-xs text-yellow-700">
                      El frontend está funcionando correctamente, pero el backend está devolviendo un error 500. 
                      Esto indica que hay un problema interno en el servidor, no en la configuración del frontend.
                    </p>
                  </div>
                  
                  {/* Prueba de endpoints */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800 font-medium mb-2">🔍 Prueba de Endpoints:</p>
                    <button
                      onClick={probarEndpoints}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium mb-3"
                    >
                      Probar Todos los Endpoints
                    </button>
                    
                    <div className="text-xs text-blue-700 mb-2">
                      <p><strong>Endpoints a probar:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        <li>Configuraciones: /directivo/configuraciones/</li>
                        <li>Comparativa Semanas: /directivo/finanzas/comparativa-semanas/</li>
                        <li>Resumen Ejecutivo: /directivo/finanzas/resumen-ejecutivo/</li>
                        <li>Todos Monitores: /directivo/finanzas/todos-monitores/</li>
                        <li>Monitor Individual: /directivo/finanzas/monitor/1/</li>
                      </ul>
                    </div>
                    
                    {Object.keys(endpointsStatus).length > 0 && (
                      <div className="space-y-1">
                        {Object.entries(endpointsStatus).map(([name, status]) => (
                          <div key={name} className="flex items-center justify-between text-xs">
                            <span className="text-blue-700">{name}:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              status === 'success' ? 'bg-green-100 text-green-700' :
                              status === 'error' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {status === 'success' ? '✅ OK' :
                               status === 'error' ? '❌ Error' :
                               '⏳ Probando...'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      Revisa la consola del navegador (F12) para ver los logs detallados de depuración.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setServicioDisponible(true);
                      setError(null);
                      cargarResumenEjecutivo();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium mr-2"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={activarModoDemostracion}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium mr-2"
                  >
                    Ver Demostración
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium"
                  >
                    Volver al Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Contenido normal cuando el servicio está disponible */}
          {servicioDisponible && (
            <>
              {/* Dashboard Ejecutivo */}
              {vistaActiva === 'resumen' && resumenEjecutivo && (
                <div className="space-y-8">
                  {/* Métricas principales con diseño PowerBI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Monitores */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium">Total Monitores</p>
                          <p className="text-3xl font-bold">{resumenEjecutivo.metricas_principales.total_monitores}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Costo Actual */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium">Costo Actual</p>
                          <p className="text-2xl font-bold">{formatearMoneda(resumenEjecutivo.metricas_principales.costo_total_actual)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Costo Proyectado */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium">Costo Proyectado</p>
                          <p className="text-2xl font-bold">{formatearMoneda(resumenEjecutivo.metricas_principales.costo_total_proyectado)}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* % Ejecutado */}
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100 text-sm font-medium">% Ejecutado</p>
                          <p className="text-3xl font-bold">{formatearPorcentaje(resumenEjecutivo.indicadores_financieros.porcentaje_ejecutado)}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-400 bg-opacity-30 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráficas y Visualizaciones */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gráfica de Progreso Circular */}
                    <div className="bg-white rounded-xl shadow-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Progreso del Presupuesto</h3>
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
                              stroke="url(#gradient)"
                              strokeWidth="8"
                              fill="none"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - resumenEjecutivo.indicadores_financieros.porcentaje_ejecutado / 100)}`}
                              className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-900">
                                {formatearPorcentaje(resumenEjecutivo.indicadores_financieros.porcentaje_ejecutado)}
                              </div>
                              <div className="text-sm text-gray-600">Ejecutado</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Indicadores Financieros con Diseño Moderno */}
                    <div className="bg-white rounded-xl shadow-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6">Indicadores Financieros</h3>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Costo por Hora</p>
                              <p className="text-lg font-bold text-gray-900">{formatearMoneda(resumenEjecutivo.indicadores_financieros.costo_por_hora)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Promedio por Monitor</p>
                              <p className="text-lg font-bold text-gray-900">{formatearMoneda(resumenEjecutivo.indicadores_financieros.costo_promedio_por_monitor)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Semanal Promedio</p>
                              <p className="text-lg font-bold text-gray-900">{formatearMoneda(resumenEjecutivo.indicadores_financieros.costo_semanal_promedio)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Monitores con Diseño Moderno */}
                  {reporteTodos && (
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                        <h3 className="text-xl font-bold text-white">Rendimiento de Monitores</h3>
                        <p className="text-blue-100 text-sm mt-1">Análisis detallado del progreso y costos por monitor</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitor</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Progreso</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Costos</th>
                              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Eficiencia</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reporteTodos.monitores.map((monitor, index) => (
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
                                      <div className="text-sm text-gray-500">{monitor.monitor.username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="space-y-3">
                                    {/* Información de horas */}
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Trabajadas:</span>
                                        <span className="text-sm font-semibold text-green-600">
                                          {formatearHoras(monitor.finanzas_actuales.horas_trabajadas)}
                                        </span>
                                      </div>
                                      {totalHoras && totalHoras.monitores && (() => {
                                        const monitorTotalHoras = totalHoras.monitores.find((m: any) => m.monitor.id === monitor.monitor.id);
                                        if (monitorTotalHoras) {
                                          const horasTrabajadas = monitor.finanzas_actuales.horas_trabajadas;
                                          const horasTotales = monitorTotalHoras.horas_semestre;
                                          const horasFaltantes = Math.max(0, horasTotales - horasTrabajadas);
                                          
                                          return (
                                            <>
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Total Semestre:</span>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {formatearHoras(horasTotales)}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Faltan:</span>
                                                <span className="text-sm font-medium text-orange-600">
                                                  {formatearHoras(horasFaltantes)}
                                                </span>
                                              </div>
                                            </>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                    
                                    {/* Barra de progreso */}
                                    <div className="space-y-2">
                                      {/* Información de horas encima de la barra */}
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Progreso Real</span>
                                        {totalHoras && totalHoras.monitores && (() => {
                                          const monitorTotalHoras = totalHoras.monitores.find((m: any) => m.monitor.id === monitor.monitor.id);
                                          if (monitorTotalHoras) {
                                            const horasTrabajadas = monitor.finanzas_actuales.horas_trabajadas;
                                            const horasTotales = monitorTotalHoras.horas_semestre;
                                            return (
                                              <span className="font-semibold text-blue-600">
                                                {horasTrabajadas}/{horasTotales}h
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                      
                                      {/* Barra de progreso */}
                                      <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                          className="bg-gradient-to-r from-green-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                          style={{ width: `${Math.min(calcularProgresoReal(monitor), 100)}%` }}
                                        ></div>
                                      </div>
                                      
                                      {/* Porcentaje debajo de la barra */}
                                      <div className="text-center">
                                        <span className="text-xs font-semibold text-gray-700">
                                          {formatearPorcentaje(calcularProgresoReal(monitor))}
                                        </span>
                                      </div>
                                    </div>
                                    
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Actual:</span>
                                      <span className="text-sm font-semibold text-green-600">
                                        {formatearMoneda(monitor.finanzas_actuales.costo_total)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Proyectado:</span>
                                      <span className="text-sm font-medium text-gray-700">
                                        {formatearMoneda(monitor.proyeccion_semestre.costo_total_proyectado)}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      <div className={`w-3 h-3 rounded-full ${
                                        calcularProgresoReal(monitor) >= 80 
                                          ? 'bg-green-500' 
                                          : calcularProgresoReal(monitor) >= 60 
                                          ? 'bg-yellow-500' 
                                          : 'bg-red-500'
                                      }`}></div>
                                    </div>
                                    <div className="ml-2">
                                      <div className="text-sm font-medium text-gray-900">
                                        {calcularProgresoReal(monitor) >= 80 
                                          ? 'Excelente' 
                                          : calcularProgresoReal(monitor) >= 60 
                                          ? 'Bueno' 
                                          : 'En Progreso'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {resumenEjecutivo.alertas && resumenEjecutivo.alertas.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-yellow-800">Alertas del Sistema</h3>
                          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                            {resumenEjecutivo.alertas.map((alerta, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{alerta.mensaje}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vista de Configuraciones */}
              {vistaActiva === 'configuraciones' && (
                <div className="space-y-6 bg-transparent">
                  <div className="bg-white rounded-lg shadow-md border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Configuraciones del Sistema</h3>
                    <div className="space-y-4">
                      {configuraciones.map((config) => (
                        <div key={config.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{config.clave}</div>
                            <div className="text-sm text-gray-600">{config.descripcion}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              Valor actual: <span className="font-semibold">{config.valor}</span> ({config.tipo_dato})
                            </div>
                          </div>
                          <button
                            onClick={() => abrirModalConfiguracion(config)}
                            className="ml-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Mensaje cuando no hay datos */}
              {vistaActiva !== 'resumen' && vistaActiva !== 'configuraciones' && vistaActiva !== 'total-horas' && !reporteTodos && !reporteMonitor && !comparativaSemanas && !loading && (
                <div className="bg-white border rounded shadow p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para mostrar</h3>
                  <p className="text-gray-600 mb-4">
                    Ajusta los filtros o selecciona otro monitor para ver el reporte.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        console.log('Prueba directa - Estado:', { token, query, loading, error });
                        cargarResumenEjecutivo();
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium mr-2"
                    >
                      🔄 Recargar Datos
                    </button>
                    <button
                      onClick={() => {
                        console.log('Prueba de endpoint directo...');
                        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}directivo/finanzas/resumen-ejecutivo/?fecha_inicio=2025-03-20&fecha_fin=2025-09-20&semanas_trabajadas=8`, {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                          }
                        })
                        .then(res => {
                          console.log('Respuesta directa:', res.status, res.statusText);
                          return res.json();
                        })
                        .then(data => {
                          console.log('Datos directos:', data);
                          setResumenEjecutivo(data);
                        })
                        .catch(err => console.error('Error directo:', err));
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                      🧪 Prueba Directa
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-2 text-gray-600">Cargando...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}