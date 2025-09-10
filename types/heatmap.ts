import { Usuario } from './auth';

// Datos para el mapa de calor de asistencia anual
export interface HeatmapData {
  monitor_id: number;
  monitor: Pick<Usuario, 'id' | 'nombre' | 'username'>;
  fecha: string; // YYYY-MM-DD
  presente: boolean;
  estado_autorizacion: 'pendiente' | 'autorizado' | 'rechazado';
  jornada: 'M' | 'T';
  sede: 'SA' | 'BA';
}

// Query para obtener datos del mapa de calor
export interface HeatmapQuery {
  año?: number; // Si no se especifica, usa el año actual
  monitor_id?: number; // Si no se especifica, trae todos los monitores
  sede?: 'SA' | 'BA' | ''; // Filtro por sede
  jornada?: 'M' | 'T' | ''; // Filtro por jornada
}

// Respuesta del servicio de mapa de calor
export interface HeatmapResponse {
  datos: HeatmapData[];
  año: number;
  total_monitores: number;
  total_dias: number;
  estadisticas: {
    total_asistencias: number;
    total_ausencias: number;
    porcentaje_asistencia: number;
  };
}

// Datos procesados para el componente de mapa de calor
export interface ProcessedHeatmapData {
  monitor: Pick<Usuario, 'id' | 'nombre' | 'username'>;
  datos_por_dia: {
    [fecha: string]: {
      presente: boolean;
      estado_autorizacion: 'pendiente' | 'autorizado' | 'rechazado';
      jornada: 'M' | 'T';
      sede: 'SA' | 'BA';
    };
  };
  estadisticas_monitor: {
    total_dias: number;
    total_presente: number;
    total_ausente: number;
    porcentaje_asistencia: number;
  };
}
