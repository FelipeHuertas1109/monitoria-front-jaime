// Utilidades para validación y sincronización de datos entre módulos

export interface ValidationResult {
  isValid: boolean;
  discrepancies: Discrepancy[];
  warnings: string[];
}

export interface Discrepancy {
  type: 'hours' | 'asistencias' | 'ajustes' | 'periodo';
  module: 'reportes' | 'finanzas';
  field: string;
  expectedValue: number;
  actualValue: number;
  difference: number;
  description: string;
}

export interface ModuleData {
  horas_trabajadas: number;
  horas_asistencias: number;
  horas_ajustes: number;
  total_asistencias: number;
  asistencias_presentes: number;
  asistencias_autorizadas: number;
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  filtros: {
    sede?: string;
    jornada?: string;
    monitor_id?: number;
  };
}

/**
 * Valida la consistencia de datos entre los módulos de reportes y finanzas
 */
export function validateDataConsistency(
  reportesData: ModuleData,
  finanzasData: ModuleData,
  tolerance: number = 0.01 // Tolerancia para diferencias de horas (0.01h = 36 segundos)
): ValidationResult {
  const discrepancies: Discrepancy[] = [];
  const warnings: string[] = [];

  // Validar período
  if (reportesData.periodo.fecha_inicio !== finanzasData.periodo.fecha_inicio) {
    discrepancies.push({
      type: 'periodo',
      module: 'reportes',
      field: 'fecha_inicio',
      expectedValue: 0,
      actualValue: 0,
      difference: 0,
      description: `Período de inicio diferente: Reportes (${reportesData.periodo.fecha_inicio}) vs Finanzas (${finanzasData.periodo.fecha_inicio})`
    });
  }

  if (reportesData.periodo.fecha_fin !== finanzasData.periodo.fecha_fin) {
    discrepancies.push({
      type: 'periodo',
      module: 'reportes',
      field: 'fecha_fin',
      expectedValue: 0,
      actualValue: 0,
      difference: 0,
      description: `Período de fin diferente: Reportes (${reportesData.periodo.fecha_fin}) vs Finanzas (${finanzasData.periodo.fecha_fin})`
    });
  }

  // Validar filtros
  const filtrosDiferentes = Object.keys(reportesData.filtros).some(key => 
    reportesData.filtros[key as keyof typeof reportesData.filtros] !== 
    finanzasData.filtros[key as keyof typeof finanzasData.filtros]
  );

  if (filtrosDiferentes) {
    warnings.push('Los filtros aplicados son diferentes entre módulos');
  }

  // Validar horas trabajadas
  const diferenciaHoras = Math.abs(reportesData.horas_trabajadas - finanzasData.horas_trabajadas);
  if (diferenciaHoras > tolerance) {
    discrepancies.push({
      type: 'hours',
      module: 'finanzas',
      field: 'horas_trabajadas',
      expectedValue: reportesData.horas_trabajadas,
      actualValue: finanzasData.horas_trabajadas,
      difference: diferenciaHoras,
      description: `Diferencia de ${diferenciaHoras.toFixed(2)}h en horas trabajadas`
    });
  }

  // Validar horas de asistencias
  const diferenciaHorasAsistencias = Math.abs(reportesData.horas_asistencias - finanzasData.horas_asistencias);
  if (diferenciaHorasAsistencias > tolerance) {
    discrepancies.push({
      type: 'hours',
      module: 'finanzas',
      field: 'horas_asistencias',
      expectedValue: reportesData.horas_asistencias,
      actualValue: finanzasData.horas_asistencias,
      difference: diferenciaHorasAsistencias,
      description: `Diferencia de ${diferenciaHorasAsistencias.toFixed(2)}h en horas de asistencias`
    });
  }

  // Validar horas de ajustes
  const diferenciaHorasAjustes = Math.abs(reportesData.horas_ajustes - finanzasData.horas_ajustes);
  if (diferenciaHorasAjustes > tolerance) {
    discrepancies.push({
      type: 'ajustes',
      module: 'finanzas',
      field: 'horas_ajustes',
      expectedValue: reportesData.horas_ajustes,
      actualValue: finanzasData.horas_ajustes,
      difference: diferenciaHorasAjustes,
      description: `Diferencia de ${diferenciaHorasAjustes.toFixed(2)}h en ajustes de horas`
    });
  }

  // Validar número de asistencias
  if (reportesData.total_asistencias !== finanzasData.total_asistencias) {
    discrepancies.push({
      type: 'asistencias',
      module: 'finanzas',
      field: 'total_asistencias',
      expectedValue: reportesData.total_asistencias,
      actualValue: finanzasData.total_asistencias,
      difference: Math.abs(reportesData.total_asistencias - finanzasData.total_asistencias),
      description: `Diferencia de ${Math.abs(reportesData.total_asistencias - finanzasData.total_asistencias)} asistencias`
    });
  }

  return {
    isValid: discrepancies.length === 0,
    discrepancies,
    warnings
  };
}

/**
 * Genera un resumen de validación para mostrar al usuario
 */
export function generateValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return '✅ Los datos están sincronizados correctamente entre todos los módulos.';
  }

  let summary = '⚠️ Se encontraron discrepancias en los datos:\n\n';
  
  result.discrepancies.forEach((discrepancy, index) => {
    summary += `${index + 1}. ${discrepancy.description}\n`;
  });

  if (result.warnings.length > 0) {
    summary += '\nAdvertencias:\n';
    result.warnings.forEach((warning, index) => {
      summary += `• ${warning}\n`;
    });
  }

  return summary;
}

/**
 * Formatea las horas para mostrar en la validación
 */
export function formatHoursForValidation(hours: number): string {
  return `${hours.toFixed(2)}h`;
}

/**
 * Obtiene el color apropiado para mostrar el estado de validación
 */
export function getValidationColor(isValid: boolean, hasWarnings: boolean): string {
  if (isValid && !hasWarnings) return 'text-green-600';
  if (isValid && hasWarnings) return 'text-yellow-600';
  return 'text-red-600';
}
