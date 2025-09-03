# 📊 Guía del Sistema de Asistencias

## 🎯 **Descripción General**

El sistema de asistencias permite a los directivos gestionar y autorizar las asistencias de los monitores, mientras que los monitores pueden marcar su presencia y consultar sus asistencias.

## 🔑 **Endpoints de la API**

### 📋 **Para Directivos**

#### Listar Asistencias
```http
GET /directivo/asistencias/
Authorization: Bearer <token>
```

**Parámetros de consulta opcionales:**
- `fecha` (YYYY-MM-DD): Fecha específica. Si no se envía, trae las de hoy
- `estado`: `pendiente`, `autorizado`, `rechazado`
- `jornada`: `M` (Mañana), `T` (Tarde)
- `sede`: `SA` (San Antonio), `BA` (Barcelona)

**Ejemplos:**
```http
# Todas las asistencias de hoy
GET /directivo/asistencias/

# Asistencias de una fecha específica
GET /directivo/asistencias/?fecha=2024-01-15

# Asistencias pendientes de autorización
GET /directivo/asistencias/?estado=pendiente

# Asistencias de mañana en San Antonio
GET /directivo/asistencias/?jornada=M&sede=SA
```

#### Autorizar/Rechazar Asistencia
```http
POST /directivo/asistencias/{id}/autorizar/
POST /directivo/asistencias/{id}/rechazar/
Authorization: Bearer <token>
```

### 👨‍🏫 **Para Monitores**

#### Ver Mis Asistencias
```http
GET /monitor/mis-asistencias/
Authorization: Bearer <token>
```

**Parámetros opcionales:**
- `fecha` (YYYY-MM-DD): Si no se envía, trae las de hoy

```http
# Mis asistencias de hoy
GET /monitor/mis-asistencias/

# Mis asistencias de una fecha específica
GET /monitor/mis-asistencias/?fecha=2024-01-15
```

#### Marcar Presente
```http
POST /monitor/marcar/
Authorization: Bearer <token>
Content-Type: application/json

{
  "fecha": "2024-01-15",
  "jornada": "M"
}
```

## 📄 **Estructura de Respuesta**

### Asistencia
```json
{
  "id": 1,
  "usuario": {
    "id": 3,
    "username": "monitor1",
    "nombre": "Juan Monitor",
    "tipo_usuario": "MONITOR",
    "tipo_usuario_display": "Monitor"
  },
  "fecha": "2024-01-15",
  "horario": {
    "id": 1,
    "usuario": {...},
    "dia_semana": 0,
    "dia_semana_display": "Lunes",
    "jornada": "M",
    "jornada_display": "Mañana",
    "sede": "SA",
    "sede_display": "San Antonio"
  },
  "presente": true,
  "estado_autorizacion": "autorizado",
  "estado_autorizacion_display": "Autorizado",
  "horas": 4.00
}
```

## 🎨 **Funcionalidades del Frontend**

### **Vista de Directivo** (`/directivo/asistencias`)

**Características:**
- ✅ Filtros avanzados (fecha, estado, jornada, sede)
- ✅ Vista de tabla responsive (desktop) y tarjetas (mobile)
- ✅ Autorización/rechazo con un clic
- ✅ Actualización automática cada 30 segundos
- ✅ Optimistic UI para mejor experiencia
- ✅ Manejo robusto de errores

**Filtros disponibles:**
- **Fecha**: Selector de fecha (por defecto hoy)
- **Estado**: Todos, Pendiente, Autorizado, Rechazado
- **Jornada**: Todas, Mañana, Tarde
- **Sede**: Todas, San Antonio, Barcelona

### **Vista de Monitor** (`/monitor/asistencias`)

**Características:**
- ✅ Ver asistencias propias por fecha
- ✅ Marcar presente por jornada
- ✅ Estados claros: No marcado, Marcado (pendiente), Autorizado ✅, Rechazado ❌
- ✅ UI simple e intuitiva
- ✅ Optimistic UI para marcado inmediato

## 💻 **Implementación Técnica**

### **Servicios** (`services/asistencias.ts`)
```typescript
export class AsistenciasService {
  // Directivo: listar con filtros
  static async listar(query: ListarAsistenciasQuery, token: string)
  
  // Directivo: autorizar asistencia
  static async autorizar(id: number, token: string)
  
  // Directivo: rechazar asistencia  
  static async rechazar(id: number, token: string)
  
  // Monitor: ver mis asistencias
  static async misAsistencias(query: MisAsistenciasQuery, token: string)
  
  // Monitor: marcar presente
  static async marcar(body: MarcarPresenteRequest, token: string)
}
```

### **Tipos TypeScript** (`types/asistencias.ts`)
```typescript
// Estados y catálogos
export type EstadoAutorizacion = 'pendiente' | 'autorizado' | 'rechazado';
export type Jornada = 'M' | 'T';
export type Sede = 'SA' | 'BA';

// Entidades principales
export interface Asistencia { ... }
export interface Horario { ... }

// Queries y responses
export interface ListarAsistenciasQuery { ... }
export interface MisAsistenciasQuery { ... }
export interface MarcarPresenteRequest { ... }
```

## 🔄 **Flujo de Trabajo**

1. **Generación automática**: El sistema genera asistencias basadas en los horarios configurados
2. **Marcado**: Los monitores marcan su presencia (estado: pendiente)
3. **Supervisión**: Los directivos revisan las asistencias del día
4. **Autorización**: Los directivos autorizan o rechazan cada asistencia
5. **Seguimiento**: Ambos roles pueden consultar el historial

## 🎯 **Características Destacadas**

- ⚡ **Optimistic UI**: Las acciones se reflejan inmediatamente
- 🔄 **Auto-refresh**: Actualización automática cada 30 segundos
- 📱 **Responsive**: Funciona perfecto en móvil y desktop
- ⚠️ **Manejo de errores**: Notificaciones claras con SweetAlert2
- 🔐 **Autenticación**: Manejo seguro de tokens JWT
- 🎨 **UI moderna**: Diseño atractivo con Tailwind CSS

## 🚀 **Mejoras Futuras Posibles**

- 📊 Reportes y estadísticas
- 📅 Vista de calendario
- 🔔 Notificaciones push
- 📈 Dashboard de métricas
- 💾 Exportación a Excel/PDF
