import { environment } from '../config/environment';
import {
  HeatmapQuery,
  HeatmapResponse,
} from '../types/heatmap';

export class HeatmapService {
  private static baseUrl = environment.backendUrl;

  static async obtenerDatosAnuales(query: HeatmapQuery, token: string): Promise<HeatmapResponse> {
    const año = query.año || new Date().getFullYear();
    // Solo datos de septiembre a diciembre
    const fechaInicio = `${año}-09-01`;
    const fechaFin = `${año}-12-31`;

    // Usar el endpoint de reportes de horas de todos los monitores
    return this.obtenerDatosPorRango(fechaInicio, fechaFin, token, query);
  }

  // Método que obtiene datos usando el endpoint de reportes de horas
  static async obtenerDatosPorRango(
    fechaInicio: string, 
    fechaFin: string, 
    token: string,
    query?: HeatmapQuery
  ): Promise<HeatmapResponse> {
    // Usar el endpoint de reportes de horas de todos los monitores
    const params = new URLSearchParams();
    params.set('fecha_inicio', fechaInicio);
    params.set('fecha_fin', fechaFin);
    
    // Aplicar filtros si existen
    if (query?.sede) {
      params.set('sede', query.sede);
    }
    if (query?.jornada) {
      params.set('jornada', query.jornada);
    }

    const url = `${this.baseUrl}/directivo/reportes/horas-todos/?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      if (response.status === 404) {
        return {
          datos: [],
          año: new Date(fechaInicio).getFullYear(),
          total_monitores: 0,
          total_dias: 0,
          estadisticas: {
            total_asistencias: 0,
            total_ausencias: 0,
            porcentaje_asistencia: 0,
          },
        };
      }
      if (response.status === 400) {
        throw new Error('Parámetros inválidos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();
    
    // Procesar datos del reporte para crear el heatmap
    const heatmapData: any[] = [];
    
    if (data.monitores && Array.isArray(data.monitores)) {
      data.monitores.forEach((monitor: any) => {
        if (monitor.asistencias && Array.isArray(monitor.asistencias)) {
          monitor.asistencias.forEach((asistencia: any) => {
            heatmapData.push({
              monitor_id: monitor.monitor.id,
              monitor: {
                id: monitor.monitor.id,
                nombre: monitor.monitor.nombre,
                username: monitor.monitor.username
              },
              fecha: asistencia.fecha,
              presente: asistencia.presente,
              estado_autorizacion: asistencia.estado_autorizacion,
              jornada: asistencia.horario.jornada,
              sede: asistencia.horario.sede
            });
          });
        }
      });
    }

    return {
      datos: heatmapData,
      año: new Date(fechaInicio).getFullYear(),
      total_monitores: data.monitores ? data.monitores.length : 0,
      total_dias: this.calcularDiasEntreFechas(fechaInicio, fechaFin),
      estadisticas: {
        total_asistencias: heatmapData.filter(d => d.presente).length,
        total_ausencias: heatmapData.filter(d => !d.presente).length,
        porcentaje_asistencia: heatmapData.length > 0 ? 
          (heatmapData.filter(d => d.presente).length / heatmapData.length) * 100 : 0,
      },
    };
  }

  // Función helper para calcular días entre fechas
  private static calcularDiasEntreFechas(fechaInicio: string, fechaFin: string): number {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaTiempo = fin.getTime() - inicio.getTime();
    return Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)) + 1;
  }
}
