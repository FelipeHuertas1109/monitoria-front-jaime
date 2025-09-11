'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { HeatmapService } from '../services/heatmap';
import { HeatmapQuery, HeatmapData, ProcessedHeatmapData } from '../types/heatmap';
import { formatDateFromISO } from '../utils/date';

interface HeatmapAsistenciaProps {
  año?: number;
  monitorId?: number;
  sede?: 'SA' | 'BA' | '';
  jornada?: 'M' | 'T' | '';
}

export default function HeatmapAsistencia({ 
  año = new Date().getFullYear(),
  monitorId,
  sede = '',
  jornada = ''
}: HeatmapAsistenciaProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<HeatmapData[]>([]);
  const [añoSeleccionado, setAñoSeleccionado] = useState(año);
  const [datosProcesados, setDatosProcesados] = useState<ProcessedHeatmapData[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Generar fechas de septiembre a diciembre
  const fechasDelAño = useMemo(() => {
    const fechas: string[] = [];
    // Solo septiembre (8) a diciembre (11)
    const inicioPeriodo = new Date(añoSeleccionado, 8, 1); // Septiembre
    const finPeriodo = new Date(añoSeleccionado, 11, 31); // Diciembre
    
    for (let d = new Date(inicioPeriodo); d <= finPeriodo; d.setDate(d.getDate() + 1)) {
      // Usar formateo local para evitar problemas de zona horaria
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      fechas.push(`${year}-${month}-${day}`);
    }
    return fechas;
  }, [añoSeleccionado]);

  // Procesar datos para el mapa de calor
  const procesarDatos = useCallback((datosRaw: HeatmapData[]): ProcessedHeatmapData[] => {
    const monitoresMap = new Map<number, ProcessedHeatmapData>();

    datosRaw.forEach(item => {
      if (!monitoresMap.has(item.monitor_id)) {
        monitoresMap.set(item.monitor_id, {
          monitor: item.monitor,
          datos_por_dia: {},
          estadisticas_monitor: {
            total_dias: 0,
            total_presente: 0,
            total_ausente: 0,
            porcentaje_asistencia: 0,
          },
        });
      }

      const monitorData = monitoresMap.get(item.monitor_id)!;
      monitorData.datos_por_dia[item.fecha] = {
        presente: item.presente,
        estado_autorizacion: item.estado_autorizacion,
        jornada: item.jornada,
        sede: item.sede,
      };
    });

    // Calcular estadísticas para cada monitor
    monitoresMap.forEach(monitorData => {
      const totalDias = Object.keys(monitorData.datos_por_dia).length;
      const totalPresente = Object.values(monitorData.datos_por_dia).filter(d => d.presente).length;
      const totalAusente = totalDias - totalPresente;
      const porcentaje = totalDias > 0 ? (totalPresente / totalDias) * 100 : 0;

      monitorData.estadisticas_monitor = {
        total_dias: totalDias,
        total_presente: totalPresente,
        total_ausente: totalAusente,
        porcentaje_asistencia: Math.round(porcentaje * 100) / 100,
      };
    });

    return Array.from(monitoresMap.values());
  }, []);

  // Actualizar datos procesados cuando cambien los datos
  useEffect(() => {
    setDatosProcesados(procesarDatos(datos));
  }, [datos, procesarDatos]);

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newDatos = [...datosProcesados];
    const draggedItem = newDatos[draggedIndex];
    
    // Remover el elemento arrastrado
    newDatos.splice(draggedIndex, 1);
    
    // Insertar en la nueva posición
    newDatos.splice(dropIndex, 0, draggedItem);
    
    setDatosProcesados(newDatos);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Obtener datos del mapa de calor
  const fetchDatos = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const query: HeatmapQuery = {
        año: añoSeleccionado,
        monitor_id: monitorId,
        sede: sede || undefined,
        jornada: jornada || undefined,
      };

      const response = await HeatmapService.obtenerDatosAnuales(query, token);
      setDatos(response.datos);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al cargar datos del mapa de calor';
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

  useEffect(() => {
    fetchDatos();
  }, [token, añoSeleccionado, monitorId, sede, jornada]);

  // Función para obtener el color de una celda
  const getCellColor = (presente: boolean, estado: string) => {
    if (!presente) return 'bg-gray-200'; // Ausente
    if (estado === 'autorizado') return 'bg-green-500'; // Presente y autorizado
    if (estado === 'pendiente') return 'bg-yellow-400'; // Presente pero pendiente
    if (estado === 'rechazado') return 'bg-red-500'; // Presente pero rechazado
    return 'bg-gray-200';
  };

  // Función para obtener el tooltip de una celda
  const getTooltip = (fecha: string, monitor: string, presente: boolean, estado: string, jornada: string, sede: string) => {
    const fechaFormateada = formatDateFromISO(fecha);
    
    const estadoTexto = estado === 'autorizado' ? 'Autorizado' : 
                       estado === 'pendiente' ? 'Pendiente' : 'Rechazado';
    
    return `${monitor}\n${fechaFormateada}\n${presente ? 'Presente' : 'Ausente'} - ${estadoTexto}\n${jornada === 'M' ? 'Mañana' : 'Tarde'} - ${sede === 'SA' ? 'San Antonio' : 'Barcelona'}`;
  };

  // Obtener nombres de los meses (solo septiembre a diciembre)
  const meses = [
    'Sep', 'Oct', 'Nov', 'Dic'
  ];

  // Agrupar fechas por mes (solo septiembre a diciembre)
  const fechasPorMes = useMemo(() => {
    const agrupadas: { [mes: number]: string[] } = {};
    fechasDelAño.forEach(fecha => {
      // Parsear fecha localmente para evitar problemas de zona horaria
      const [year, month, day] = fecha.split('-').map(Number);
      const mes = month - 1; // month es 0-indexado
      // Solo incluir meses de septiembre (8) a diciembre (11)
      if (mes >= 8 && mes <= 11) {
        if (!agrupadas[mes]) agrupadas[mes] = [];
        agrupadas[mes].push(fecha);
      }
    });
    return agrupadas;
  }, [fechasDelAño]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Cargando mapa de calor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">
            Mapa de Calor de Asistencia {añoSeleccionado} (Sep-Dic)
          </h2>
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const año = new Date().getFullYear() - 2 + i;
              return (
                <option key={año} value={año}>
                  {año}
                </option>
              );
            })}
          </select>
        </div>
        
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

      {/* Mapa de calor */}
      <div className="bg-white border rounded-lg shadow overflow-x-auto">
        <div className="p-4">
          {datosProcesados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay datos de asistencia para septiembre-diciembre {añoSeleccionado}
            </div>
          ) : (
            <div className="space-y-6">
              {datosProcesados.map((monitorData, index) => (
                <div 
                  key={monitorData.monitor.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-b border-gray-200 pb-6 last:border-b-0 cursor-move transition-all duration-200 ${
                    draggedIndex === index 
                      ? 'opacity-50 scale-95 shadow-lg' 
                      : 'hover:shadow-md hover:scale-[1.01]'
                  }`}
                >
                  {/* Información del monitor */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-700 font-semibold text-sm">
                          {monitorData.monitor.nombre?.slice(0, 1) || 'M'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {monitorData.monitor.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{monitorData.monitor.username}
                        </p>
                      </div>
                    </div>
                    
                    {/* Indicador de arrastre */}
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                      <span>Arrastra para reordenar</span>
                    </div>
                    
                    {/* Estadísticas del monitor */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-green-600">
                          {monitorData.estadisticas_monitor.total_presente}
                        </div>
                        <div className="text-gray-500">Presentes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-red-600">
                          {monitorData.estadisticas_monitor.total_ausente}
                        </div>
                        <div className="text-gray-500">Ausentes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-indigo-600">
                          {monitorData.estadisticas_monitor.porcentaje_asistencia}%
                        </div>
                        <div className="text-gray-500">Asistencia</div>
                      </div>
                    </div>
                  </div>

                  {/* Grilla del mapa de calor */}
                  <div className="space-y-2">
                    {Object.entries(fechasPorMes).map(([mes, fechas]) => (
                      <div key={mes} className="flex items-center gap-2">
                        <div className="w-12 text-xs font-medium text-gray-600 text-right">
                          {meses[parseInt(mes) - 8]}
                        </div>
                        <div className="flex gap-1">
                          {fechas.map(fecha => {
                            const diaData = monitorData.datos_por_dia[fecha];
                            // Extraer día de la fecha ISO para evitar problemas de zona horaria
                            const dia = parseInt(fecha.split('-')[2]);
                            
                            return (
                              <div
                                key={fecha}
                                className={`w-3 h-3 rounded-sm cursor-pointer hover:scale-110 transition-transform ${diaData ? getCellColor(diaData.presente, diaData.estado_autorizacion) : 'bg-gray-100'}`}
                                title={diaData ? getTooltip(
                                  fecha,
                                  monitorData.monitor.nombre || '',
                                  diaData.presente,
                                  diaData.estado_autorizacion,
                                  diaData.jornada,
                                  diaData.sede
                                ) : `${fecha} - Sin datos`}
                              >
                                <span className="sr-only">
                                  {dia} - {diaData ? (diaData.presente ? 'Presente' : 'Ausente') : 'Sin datos'}
                                </span>
                              </div>
                            );
                          })}
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
  );
}
