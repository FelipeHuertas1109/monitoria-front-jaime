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


