import { useCallback } from 'react';
import jsPDF from 'jspdf';

interface PDFGeneratorOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  userName?: string;
}

export const usePDFGenerator = () => {
  const generatePDF = useCallback(async (
    elementId: string, 
    options: PDFGeneratorOptions = {}
  ) => {
    const {
      filename = 'reporte-asistencias.pdf',
      title = 'Reporte de Asistencias',
      orientation = 'portrait',
      userName = ''
    } = options;

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Elemento no encontrado para generar PDF');
      }

      // Crear PDF
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Colores del tema
      const primaryColor = [79, 70, 229]; // Indigo
      const secondaryColor = [107, 114, 128]; // Gray
      const successColor = [34, 197, 94]; // Green
      const warningColor = [245, 158, 11]; // Yellow

      // Función para agregar línea separadora
      const addSeparator = (y: number) => {
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setLineWidth(0.5);
        pdf.line(20, y, pdfWidth - 20, y);
        return y + 5;
      };

      // Función para agregar texto con estilo
      const addStyledText = (text: string, x: number, y: number, options: any = {}) => {
        const { fontSize = 12, fontStyle = 'normal', color = [0, 0, 0], align = 'left' } = options;
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(text, x, y, { align });
        return y + fontSize * 0.4;
      };

      // Header con fondo de color
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.rect(0, 0, pdfWidth, 30, 'F');
      
      // Título principal
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, pdfWidth / 2, 18, { align: 'center' });

      // Sin subtítulo del monitor

      yPosition = 40;

      // Fecha de generación
      const fechaGeneracion = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      yPosition = addStyledText(`Generado el: ${fechaGeneracion}`, pdfWidth - 20, yPosition, { 
        fontSize: 10, 
        color: [secondaryColor[0], secondaryColor[1], secondaryColor[2]], 
        align: 'right' 
      });

      yPosition = addSeparator(yPosition);

      // Función para extraer y formatear datos del reporte
      const extractReportData = (el: Element) => {
        const data: any = {
          estadisticas: {},
          asistencias: []
        };

        // Buscar estadísticas
        const statElements = el.querySelectorAll('[class*="text-xl"], [class*="text-2xl"]');
        statElements.forEach(stat => {
          const text = stat.textContent?.trim();
          const parent = stat.closest('[class*="bg-white"]');
          if (parent) {
            const label = parent.querySelector('[class*="text-gray-600"]')?.textContent?.trim();
            if (label && text) {
              (data.estadisticas as any)[label] = text;
            }
          }
        });

        // Buscar asistencias por fecha - método mejorado
        const asistenciaSections = el.querySelectorAll('[class*="divide-y"] > div');
        asistenciaSections.forEach(section => {
          const fechaEl = section.querySelector('h4, [class*="font-medium"]');
          if (fechaEl) {
            const fechaText = fechaEl.textContent?.trim();
            if (fechaText && fechaText.match(/\w+, \d+ de \w+ de 2025/)) {
              const asistencia = {
                fecha: fechaText,
                detalles: []
              };

              // Buscar elementos de detalle específicos
              const detalleElements = section.querySelectorAll('[class*="bg-gray-50"]');
              detalleElements.forEach(detalleEl => {
                // Extraer jornada y sede del primer span
                const jornadaSedeEl = detalleEl.querySelector('span[class*="font-medium"]');
                if (jornadaSedeEl) {
                  const jornadaSedeText = jornadaSedeEl.textContent?.trim() || '';
                  if (jornadaSedeText.includes('Tarde') || jornadaSedeText.includes('Mañana')) {
                    const jornada = jornadaSedeText.includes('Tarde') ? 'Tarde' : 'Mañana';
                    const sede = jornadaSedeText.includes('Barcelona') ? 'Barcelona' : 'San Antonio';
                    (asistencia.detalles as string[]).push(`${jornada} - ${sede}`);
                  }
                }

                // Extraer horas del segundo span
                const horasEl = detalleEl.querySelector('span[class*="text-gray-500"]');
                if (horasEl) {
                  const horasText = horasEl.textContent?.trim() || '';
                  const horas = horasText.match(/\((\d+\.?\d*h)\)/)?.[1] || '';
                  if (horas) {
                    (asistencia.detalles as string[]).push(horas);
                  }
                }

                // Extraer estado Presente/Ausente
                const estadoEl = detalleEl.querySelector('span[class*="bg-green-100"], span[class*="bg-gray-100"]');
                if (estadoEl) {
                  const estadoText = estadoEl.textContent?.trim() || '';
                  if (estadoText === 'Presente' || estadoText === 'Ausente') {
                    (asistencia.detalles as string[]).push(estadoText);
                  }
                }
              });

              if (asistencia.detalles.length > 0) {
                data.asistencias.push(asistencia);
              }
            }
          }
        });

        return data;
      };

      const reportData = extractReportData(element);

      // Si no se encontraron asistencias, usar método de respaldo mejorado
      if (reportData.asistencias.length === 0) {
        // Método de respaldo: extraer todo el texto y buscar patrones
        const allText = element.textContent || '';
        const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentAsistencia: any = null;
        lines.forEach(line => {
          // Detectar fechas (más específico)
          if (line.match(/\w+, \d+ de \w+ de 2025/)) {
            if (currentAsistencia && currentAsistencia.detalles.length > 0) {
              reportData.asistencias.push(currentAsistencia);
            }
            currentAsistencia = {
              fecha: line,
              detalles: []
            };
          } else if (currentAsistencia) {
            // Solo agregar líneas relevantes y limpias
            if (line.includes('asistencia') && line.match(/\d+ asistencia/)) {
              // No agregar, es redundante
            } else if (line.includes('Tarde') || line.includes('Mañana')) {
              // Extraer jornada y sede
              const jornada = line.includes('Tarde') ? 'Tarde' : 'Mañana';
              const sede = line.includes('Barcelona') ? 'Barcelona' : 'San Antonio';
              currentAsistencia.detalles.push(`${jornada} - ${sede}`);
            } else if (line.match(/\(\d+\.?\d*h\)/)) {
              // Extraer horas
              const horas = line.match(/\((\d+\.?\d*h)\)/)?.[1] || '';
              if (horas) {
                currentAsistencia.detalles.push(horas);
              }
            } else if (line === 'Presente' || line === 'Ausente') {
              currentAsistencia.detalles.push(line);
            }
          }
        });
        
        // Agregar la última asistencia si existe
        if (currentAsistencia && currentAsistencia.detalles.length > 0) {
          reportData.asistencias.push(currentAsistencia);
        }
      }

      // Sección de estadísticas
      yPosition = addStyledText('ESTADÍSTICAS GENERALES', 20, yPosition, { 
        fontSize: 16, 
        fontStyle: 'bold', 
        color: [primaryColor[0], primaryColor[1], primaryColor[2]]
      });
      yPosition += 5;

      // Crear tabla de estadísticas
      const stats = Object.entries(reportData.estadisticas);
      if (stats.length > 0) {
        const colWidth = (pdfWidth - 40) / 2;
        let col = 0;
        let row = 0;

        stats.forEach(([label, value], index) => {
          const x = 20 + (col * colWidth);
          const y = yPosition + (row * 15);

          // Fondo alternado para las filas
          if (row % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(x, y - 8, colWidth - 5, 12, 'F');
          }

          // Label
          addStyledText(label, x + 5, y - 2, { fontSize: 10, color: [secondaryColor[0], secondaryColor[1], secondaryColor[2]] });
          // Value
          addStyledText(String(value), x + 5, y + 3, { fontSize: 14, fontStyle: 'bold', color: [primaryColor[0], primaryColor[1], primaryColor[2]] });

          col++;
          if (col >= 2) {
            col = 0;
            row++;
          }
        });

        yPosition += (Math.ceil(stats.length / 2) * 15) + 10;
      }

      yPosition = addSeparator(yPosition);

      // Sección de asistencias detalladas
      yPosition = addStyledText('DETALLE DE ASISTENCIAS', 20, yPosition, { 
        fontSize: 16, 
        fontStyle: 'bold', 
        color: [primaryColor[0], primaryColor[1], primaryColor[2]]
      });
      yPosition += 5;

      // Procesar asistencias
      reportData.asistencias.forEach((asistencia: any) => {
        // Verificar si necesitamos nueva página
        if (yPosition > pdfHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        // Fecha
        yPosition = addStyledText(asistencia.fecha, 20, yPosition, { 
          fontSize: 12, 
          fontStyle: 'bold', 
          color: [primaryColor[0], primaryColor[1], primaryColor[2]]
        });

        // Detalles de la asistencia
        (asistencia.detalles as string[]).forEach((detalle: string) => {
          if (yPosition > pdfHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          // Determinar color según el contenido
          let color = [0, 0, 0];
          if (detalle.includes('Presente')) color = successColor;
          else if (detalle.includes('Ausente')) color = [239, 68, 68]; // Red
          else if (detalle.includes('Autorizado')) color = successColor;
          else if (detalle.includes('Pendiente')) color = warningColor;

          yPosition = addStyledText(`  • ${detalle}`, 30, yPosition, { 
            fontSize: 10, 
            color 
          });
        });

        yPosition += 5;
      });

      // Pie de página en todas las páginas
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        
        // Línea separadora del pie
        pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.setLineWidth(0.3);
        pdf.line(20, pdfHeight - 15, pdfWidth - 20, pdfHeight - 15);
        
        // Información del pie
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.text(`Página ${i} de ${pageCount}`, pdfWidth - 20, pdfHeight - 10, { align: 'right' });
        pdf.text('Sistema de Monitoreo de Asistencias', 20, pdfHeight - 10);
      }

      // Guardar PDF
      pdf.save(filename);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      throw error;
    }
  }, []);

  return { generatePDF };
};