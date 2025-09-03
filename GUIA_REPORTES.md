# 📊 Guía del Módulo de Reportes

## 🎯 **Descripción General**

El módulo de reportes permite a los directivos analizar estadísticas completas sobre las asistencias de los monitores, con múltiples vistas y capacidades de exportación.

## 🔗 **Acceso al Módulo**

- **URL**: `/directivo/reportes`
- **Acceso**: Solo para usuarios con tipo `DIRECTIVO`
- **Desde Dashboard**: Card "📊 Reportes" en la página principal

## 📈 **Funcionalidades Principales**

### 1. **Reporte de Todos los Monitores** 👥

Vista consolidada con estadísticas de todo el equipo:

**Estadísticas Globales:**
- 👥 Total de monitores
- 📊 Total de asistencias
- ⏰ Total de horas trabajadas
- 📈 Promedio de horas por monitor

**Tabla por Monitor:**
- Nombre y usuario del monitor
- Ratio de asistencias (presentes/total)
- Porcentaje de asistencia (con códigos de color)
- Asistencias autorizadas
- Total de horas

**Filtros Disponibles:**
- 📅 Período (fecha inicio - fecha fin)
- 🏢 Sede (Todas, San Antonio, Barcelona)
- 🌅 Jornada (Todas, Mañana, Tarde)

### 2. **Reporte de Monitor Individual** 👤

Análisis detallado de un monitor específico:

**Estadísticas del Monitor:**
- ⏰ Total de horas trabajadas
- 📊 Total de asistencias programadas
- ✅ Asistencias marcadas como presente
- 📋 Asistencias autorizadas
- 📈 Promedio de horas por día

**Detalle por Fecha:**
- Vista cronológica de todas las asistencias
- Estado de cada asistencia (presente/ausente)
- Estado de autorización (pendiente/autorizado/rechazado)
- Desglose por jornada y sede
- Horas trabajadas por sesión

## 🚀 **Características Técnicas**

### **Endpoints de API**

```http
# Reporte de horas de todos los monitores
GET /directivo/reportes/horas-todos/
?fecha_inicio=2024-01-01
&fecha_fin=2024-01-31
&sede=SA
&jornada=M

# Reporte de horas por monitor individual
GET /directivo/reportes/horas-monitor/{monitor_id}/
?fecha_inicio=2024-01-01
&fecha_fin=2024-01-31
&sede=SA
&jornada=M
```

### **Tipos de Datos**

```typescript
interface ReporteAsistenciasResponse {
  estadisticas_generales: {
    total_monitores: number;
    total_asistencias: number;
    asistencias_marcadas: number;
    asistencias_no_marcadas: number;
    asistencias_autorizadas: number;
    asistencias_pendientes: number;
    asistencias_rechazadas: number;
    porcentaje_asistencia_global: number;
    porcentaje_autorizacion_global: number;
    total_horas: number;
  };
  estadisticas_por_monitor: EstadisticaMonitor[];
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
}
```

## 🎨 **Interfaz de Usuario**

### **Navegación por Tabs**
- 👥 **Todos los Monitores**: Vista consolidada de todo el equipo
- 👤 **Monitor Individual**: Análisis detallado de un monitor específico

### **Indicadores Visuales**

**Códigos de Color para Asistencia:**
- 🟢 **Verde** (≥90%): Excelente asistencia
- 🟡 **Amarillo** (70-89%): Buena asistencia
- 🔴 **Rojo** (<70%): Asistencia baja

**Cards de Estadísticas:**
- 🔵 **Azul**: Total monitores
- 🟢 **Verde**: Asistencia global
- 🟡 **Amarillo**: Pendientes
- 🟣 **Morado**: Total horas

### **Características UX**

- ✅ **Responsive**: Funciona en móvil y desktop
- ✅ **Filtros dinámicos**: Resultados en tiempo real
- ✅ **Exportación**: Descarga directa a Excel
- ✅ **Loading states**: Indicadores de carga
- ✅ **Error handling**: Manejo robusto de errores

## 📤 **Exportación a Excel**

### **Funcionalidad**
- Botón "Exportar a Excel" en el reporte general
- Incluye todos los filtros aplicados
- Formato Excel (.xlsx) listo para análisis
- Descarga automática al navegador

### **Contenido del Archivo**
- Estadísticas generales
- Tabla completa de monitores
- Información del período
- Fecha y hora de generación

## 📊 **Casos de Uso**

### **Para Administración**
1. **Evaluación de Rendimiento**: Identificar monitores con baja asistencia
2. **Planificación**: Analizar tendencias por sede y jornada
3. **Reportes Institucionales**: Generar informes para superiores
4. **Seguimiento**: Monitoreo continuo de indicadores

### **Para Gestión de Nómina**
1. **Cálculo de Horas**: Total de horas trabajadas por monitor
2. **Autorización de Pagos**: Solo asistencias autorizadas
3. **Auditoría**: Histórico completo de asistencias

### **Para Mejora Continua**
1. **Identificación de Patrones**: Días/semanas con baja asistencia
2. **Optimización**: Ajustes en horarios según tendencias
3. **Capacitación**: Focalizar en monitores que lo necesiten

## 🔧 **Configuración Técnica**

### **Archivos del Módulo**
- `types/reportes.ts` - Definiciones TypeScript
- `services/reportes.ts` - Servicios de API
- `components/DirectivoReportes.tsx` - Componente principal
- `app/directivo/reportes/page.tsx` - Página de la aplicación

### **Dependencias**
- React con hooks (useState, useEffect)
- Next.js App Router
- TypeScript para tipado
- Tailwind CSS para estilos
- SweetAlert2 para notificaciones

## 🚀 **Beneficios del Módulo**

### ✅ **Para Directivos**
- 🎯 **Toma de Decisiones**: Datos claros para decisiones informadas
- ⏱️ **Ahorro de Tiempo**: Reportes automáticos vs. cálculos manuales
- 📈 **Visibilidad**: Tendencias y patrones visuales
- 📋 **Documentación**: Reportes exportables para reuniones

### ✅ **Para la Institución**
- 📊 **Transparencia**: Datos objetivos sobre asistencias
- 🔍 **Auditoría**: Trazabilidad completa de registros
- 💰 **Control de Costos**: Optimización de recursos humanos
- 📈 **Mejora Continua**: Identificación de oportunidades

## 🔮 **Futuras Mejoras**

### **Visualizaciones Avanzadas**
- 📊 Gráficos interactivos (Chart.js)
- 📈 Dashboard con métricas en tiempo real
- 🗓️ Vista de calendario con heat map

### **Automatización**
- 📧 Reportes automáticos por email
- 🔔 Alertas por baja asistencia
- 📅 Reportes programados

### **Análisis Avanzado**
- 🤖 Machine Learning para predicciones
- 📊 Comparativas históricas
- 🎯 KPIs personalizables

El módulo de reportes transforma datos de asistencias en información valiosa para la gestión efectiva del personal de monitoría. 🚀
