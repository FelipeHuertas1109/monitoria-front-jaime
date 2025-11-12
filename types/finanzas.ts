// Tipos para el sistema de finanzas

export interface MonitorBasico {
  id: number;
  username: string;
  nombre: string;
}

export interface Periodo {
  fecha_inicio: string;
  fecha_fin: string;
  dias_trabajados?: number;
}

export interface HorariosSemanales {
  horas_por_semana: number;
  jornadas_por_semana: number;
  detalle_por_dia?: {
    [dia: string]: Array<{
      jornada: string;
      sede: string;
    }>;
  };
}

export interface FinanzasActuales {
  horas_trabajadas: number;
  horas_asistencias: number;
  horas_ajustes: number;
  costo_total: number;
  costo_por_hora: number;
}

export interface ProyeccionSemestre {
  semanas_trabajadas: number;
  semanas_faltantes: number;
  horas_totales_proyectadas: number;
  horas_trabajadas_proyectadas: number;
  costo_total_proyectado: number;
  costo_trabajado_proyectado: number;
  porcentaje_completado: number;
}

export interface Estadisticas {
  total_asistencias: number;
  total_ajustes: number;
  promedio_horas_por_dia?: number;
  asistencias_presentes?: number;
  asistencias_autorizadas?: number;
}

// Reporte financiero individual de monitor
export interface ReporteFinancieroMonitor {
  monitor: MonitorBasico;
  periodo_actual: Periodo;
  horarios_semanales: HorariosSemanales;
  finanzas_actuales: FinanzasActuales;
  proyeccion_semestre: ProyeccionSemestre;
  estadisticas: Estadisticas;
}

// Reporte financiero de todos los monitores
export interface MonitorEnFinanzas {
  monitor: MonitorBasico;
  horarios_semanales: HorariosSemanales;
  finanzas_actuales: FinanzasActuales;
  proyeccion_semestre: ProyeccionSemestre;
  estadisticas: Estadisticas;
}

export interface ReporteFinancieroTodos {
  periodo_actual: Periodo;
  semanas_trabajadas: number;
  estadisticas_generales: {
    total_monitores: number;
    costo_total_actual: number;
    costo_total_proyectado: number;
    costo_promedio_por_monitor: number;
    horas_totales_actuales: number;
    horas_totales_proyectadas: number;
    horas_promedio_por_monitor: number;
    costo_por_hora: number;
  };
  resumen_financiero: {
    diferencia_proyeccion_vs_actual: number;
    porcentaje_ejecutado: number;
    costo_semanal_promedio: number;
  };
  monitores: MonitorEnFinanzas[];
}

// Resumen ejecutivo financiero
export interface ResumenEjecutivo {
  periodo: Periodo & { semanas_trabajadas: number };
  metricas_principales: {
    total_monitores: number;
    monitores_activos: number;
    porcentaje_actividad: number;
    costo_total_actual: number;
    costo_total_proyectado: number;
    horas_totales_actuales: number;
    horas_totales_proyectadas: number;
  };
  indicadores_financieros: {
    costo_por_hora: number;
    costo_promedio_por_monitor: number;
    costo_semanal_promedio: number;
    porcentaje_ejecutado: number;
    diferencia_presupuesto: number;
  };
  top_monitores: {
    por_costo: Array<{
      monitor: MonitorBasico;
      costo_actual: number;
      horas_trabajadas: number;
    }>;
    total_considerados: number;
  };
  alertas: Array<{
    tipo: 'info' | 'warning' | 'error' | 'success';
    mensaje: string;
  }>;
  resumen_semanal: {
    costo_semanal_total: number;
    horas_semanal_promedio: number;
    proyeccion_fin_semestre: number;
  };
}

// Comparativa por semanas
export interface SemanaComparativa {
  semana: number;
  costo_total: number;
  horas_total: number;
  monitores_activos: number;
  costo_promedio_por_monitor: number;
  estado: 'completada' | 'en_progreso' | 'pendiente';
  costo_acumulado: number;
  horas_acumuladas: number;
  porcentaje_completado: number;
}

export interface ComparativaSemanas {
  total_semanas: number;
  semanas_trabajadas: number;
  semanas_pendientes: number;
  resumen_general: {
    costo_total_semestre: number;
    horas_total_semestre: number;
    costo_promedio_por_semana: number;
    horas_promedio_por_semana: number;
  };
  semanas: SemanaComparativa[];
  tendencias: {
    costo_por_semana: number[];
    horas_por_semana: number[];
    costo_acumulado: number[];
  };
}

// Configuraciones del sistema
export interface Configuracion {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  tipo_dato: 'decimal' | 'entero' | 'texto' | 'booleano';
  valor_tipado: number | string | boolean;
  creado_por: MonitorBasico;
  created_at: string;
  updated_at: string;
}

export interface ListaConfiguraciones {
  total_configuraciones: number;
  configuraciones: Configuracion[];
}

export interface CrearConfiguracionRequest {
  clave: string;
  valor: string;
  descripcion: string;
  tipo_dato: 'decimal' | 'entero' | 'texto' | 'booleano';
}

export interface ActualizarConfiguracionRequest {
  clave: string;
  valor: string;
  descripcion: string;
  tipo_dato: 'decimal' | 'entero' | 'texto' | 'booleano';
}

export interface InicializarConfiguracionesResponse {
  mensaje: string;
  configuraciones_creadas: Configuracion[];
  configuraciones_existentes: Configuracion[];
  total_procesadas: number;
}

// Parámetros de consulta
export interface FinanzasQuery {
  fecha_inicio?: string;
  fecha_fin?: string;
  semanas_trabajadas?: number;
  sede?: 'SA' | 'BA';
  jornada?: 'M' | 'T';
}
