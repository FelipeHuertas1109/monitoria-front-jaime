// Genera fecha YYYY-MM-DD usando la zona horaria America/Bogota
export function todayBogota(): string {
  const now = new Date();
  // Usa Intl para obtener componentes en TZ objetivo
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA produce YYYY-MM-DD por defecto al formatear como string
  const parts = fmt.format(now);
  // parts ya es YYYY-MM-DD
  return parts;
}

export function formatBogotaYYYYMMDD(date: Date): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date);
}

// Formatea una fecha ISO (YYYY-MM-DD) a texto legible en zona horaria de Bogotá
export function formatDateFromISO(dateISO: string): string {
  // Crear fecha en zona horaria de Bogotá para evitar problemas de UTC
  const [year, month, day] = dateISO.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month es 0-indexado en Date
  
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Bogota'
  });
}

// Convierte una fecha local a formato ISO para el backend, ajustando por zona horaria
export function toBackendDateString(localDate: string): string {
  // Parsear la fecha local (YYYY-MM-DD)
  const [year, month, day] = localDate.split('-').map(Number);
  
  // Crear fecha en zona horaria local (no UTC)
  const localDateTime = new Date(year, month - 1, day, 12, 0, 0); // Mediodía para evitar problemas de zona horaria
  
  // Convertir a UTC para el backend
  const utcDate = new Date(localDateTime.getTime() - (localDateTime.getTimezoneOffset() * 60000));
  
  return utcDate.toISOString().split('T')[0];
}

// Obtiene el día de la semana en español para una fecha ISO
export function getDayOfWeekFromISO(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long',
    timeZone: 'America/Bogota'
  });
}


