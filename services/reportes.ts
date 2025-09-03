import { environment } from '../config/environment';
import {
  ReporteHorasQuery,
  ReporteHorasMonitorResponse,
  ReporteHorasTodosResponse,
} from '../types/reportes';

export class ReportesService {
  private static baseUrl = environment.backendUrl;

  // Reporte de horas por monitor individual
  static async reporteHorasMonitor(monitorId: number, query: ReporteHorasQuery, token: string): Promise<ReporteHorasMonitorResponse> {
    const params = new URLSearchParams();
    
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);
    if (query.sede) params.set('sede', query.sede);
    if (query.jornada) params.set('jornada', query.jornada);

    const url = `${this.baseUrl}/directivo/reportes/horas-monitor/${monitorId}/?${params.toString()}`;

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
        throw new Error('Monitor no encontrado');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    return response.json();
  }

  // Reporte de horas de todos los monitores
  static async reporteHorasTodos(query: ReporteHorasQuery, token: string): Promise<ReporteHorasTodosResponse> {
    const params = new URLSearchParams();
    
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);
    if (query.sede) params.set('sede', query.sede);
    if (query.jornada) params.set('jornada', query.jornada);

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
        throw new Error('No se encontraron datos para el período especificado');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }

    return response.json();
  }
}
