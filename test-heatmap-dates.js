// Script de prueba para verificar el manejo de fechas en el mapa de calor

// Simular la generación de fechas como en el componente
function generarFechasDelAño(añoSeleccionado) {
  const fechas = [];
  const inicioPeriodo = new Date(añoSeleccionado, 8, 1); // Septiembre
  const finPeriodo = new Date(añoSeleccionado, 11, 31); // Diciembre
  
  for (let d = new Date(inicioPeriodo); d <= finPeriodo; d.setDate(d.getDate() + 1)) {
    // Método anterior (problemático)
    const fechaAnterior = d.toISOString().split('T')[0];
    
    // Método nuevo (corregido)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fechaNueva = `${year}-${month}-${day}`;
    
    fechas.push({
      fechaAnterior,
      fechaNueva,
      diaAnterior: new Date(fechaAnterior).getDate(),
      diaNuevo: parseInt(fechaNueva.split('-')[2])
    });
  }
  return fechas;
}

// Probar con 2025
const fechas = generarFechasDelAño(2025);

console.log('Prueba de fechas en mapa de calor:');
console.log('==================================');
console.log('Primeras 10 fechas:');
console.log('');

fechas.slice(0, 10).forEach((fecha, index) => {
  console.log(`Día ${index + 1}:`);
  console.log(`  Fecha anterior: ${fecha.fechaAnterior} (día: ${fecha.diaAnterior})`);
  console.log(`  Fecha nueva:    ${fecha.fechaNueva} (día: ${fecha.diaNuevo})`);
  console.log(`  Diferente: ${fecha.diaAnterior !== fecha.diaNuevo ? 'SÍ' : 'NO'}`);
  console.log('');
});

// Verificar fechas específicas de septiembre
console.log('Fechas específicas de septiembre:');
console.log('=================================');

const fechasSeptiembre = fechas.filter(f => f.fechaNueva.startsWith('2025-09'));
fechasSeptiembre.slice(0, 5).forEach(fecha => {
  console.log(`${fecha.fechaNueva}: día ${fecha.diaNuevo} (correcto: ${fecha.diaAnterior === fecha.diaNuevo ? 'SÍ' : 'NO'})`);
});
