// Script de prueba para verificar la conversión de fechas al backend

function toBackendDateString(localDate) {
  // Parsear la fecha local (YYYY-MM-DD)
  const [year, month, day] = localDate.split('-').map(Number);
  
  // Crear fecha en zona horaria local (no UTC)
  const localDateTime = new Date(year, month - 1, day, 12, 0, 0); // Mediodía para evitar problemas de zona horaria
  
  // Convertir a UTC para el backend
  const utcDate = new Date(localDateTime.getTime() - (localDateTime.getTimezoneOffset() * 60000));
  
  return utcDate.toISOString().split('T')[0];
}

// Probar con las fechas del ejemplo
const fechasPrueba = [
  '2024-09-01', // Fecha inicio del filtro
  '2025-09-10', // Fecha fin del filtro
  '2025-01-01', // La fecha problemática que aparece
];

console.log('Prueba de conversión de fechas para el backend:');
console.log('===============================================');
console.log('');

fechasPrueba.forEach(fecha => {
  const fechaBackend = toBackendDateString(fecha);
  console.log(`Fecha local: ${fecha} -> Backend: ${fechaBackend}`);
  
  // Verificar si hay diferencia
  if (fecha !== fechaBackend) {
    console.log(`  ⚠️  DIFERENCIA DETECTADA: ${fecha} != ${fechaBackend}`);
  } else {
    console.log(`  ✅ Sin diferencia`);
  }
  console.log('');
});

// Probar con la zona horaria específica
console.log('Información de zona horaria:');
console.log('============================');
console.log(`Zona horaria del sistema: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
console.log(`Offset en minutos: ${new Date().getTimezoneOffset()}`);
console.log(`Offset en horas: ${new Date().getTimezoneOffset() / 60}`);

// Simular el problema original
console.log('');
console.log('Simulación del problema original:');
console.log('=================================');
const fechaProblematica = '2025-01-01';
const fechaBackendProblematica = toBackendDateString(fechaProblematica);
console.log(`Fecha que aparece en el reporte: ${fechaProblematica}`);
console.log(`Fecha que se enviaría al backend: ${fechaBackendProblematica}`);
console.log(`¿Está en el rango 2024-09-01 a 2025-09-10? ${fechaBackendProblematica >= '2024-09-01' && fechaBackendProblematica <= '2025-09-10' ? 'SÍ' : 'NO'}`);
