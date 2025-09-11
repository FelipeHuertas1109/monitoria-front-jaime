// Script de prueba para verificar el formateo de fechas
function formatDateFromISO(dateISO) {
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

// Probar con las fechas del ejemplo
const fechasPrueba = [
  '2025-09-01', // lunes, 1 de septiembre de 2025
  '2025-09-02', // martes, 2 de septiembre de 2025
  '2025-09-03', // miércoles, 3 de septiembre de 2025
  '2025-09-08', // lunes, 8 de septiembre de 2025
  '2025-09-09', // martes, 9 de septiembre de 2025
  '2025-09-10', // miércoles, 10 de septiembre de 2025
];

console.log('Prueba de formateo de fechas:');
console.log('================================');

fechasPrueba.forEach(fecha => {
  const formateada = formatDateFromISO(fecha);
  console.log(`${fecha} -> ${formateada}`);
});

// Comparar con el método anterior (problemático)
console.log('\nComparación con método anterior (problemático):');
console.log('===============================================');

fechasPrueba.forEach(fecha => {
  const anterior = new Date(fecha).toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const nuevo = formatDateFromISO(fecha);
  console.log(`${fecha}:`);
  console.log(`  Anterior: ${anterior}`);
  console.log(`  Nuevo:    ${nuevo}`);
  console.log(`  Diferente: ${anterior !== nuevo ? 'SÍ' : 'NO'}`);
  console.log('');
});
