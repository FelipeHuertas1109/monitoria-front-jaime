import { Asistencia } from './asistencias';

// Query parameters para reportes
export interface ReporteHorasQuery {
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
  sede?: 'SA' | 'BA' | '';
  jornada?: 'M' | 'T' | '';
}

// Reporte de horas por monitor individual
export interface ReporteHorasMonitorResponse {
  monitor: {
    id: number;
    username: string;
    nombre: string;
  };
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas: {
    total_horas: number;
    total_asistencias: number;
    asistencias_presentes: number;
    asistencias_autorizadas: number;
    promedio_horas_por_dia: number;
  };
  filtros_aplicados: {
    sede?: string;
    jornada?: string;
  };
  detalle_por_fecha: {
    [fecha: string]: Asistencia[];
  };
}

// Monitor individual en el reporte de todos
export interface MonitorEnReporte {
  monitor: {
    id: number;
    username: string;
    nombre: string;
  };
  total_horas: number;
  total_asistencias: number;
  asistencias_presentes: number;
  asistencias_autorizadas: number;
  asistencias: Asistencia[];
}

// Reporte de horas de todos los monitores
export interface ReporteHorasTodosResponse {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas_generales: {
    total_horas: number;
    total_asistencias: number;
    total_monitores: number;
    promedio_horas_por_monitor: number;
  };
  filtros_aplicados: {
    sede?: string;
    jornada?: string;
  };
  monitores: MonitorEnReporte[];
}
