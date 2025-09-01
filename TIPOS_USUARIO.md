# 👤 Tipos de Usuario en el Sistema

## 📋 Estructura del Usuario

El sistema ahora incluye información sobre el tipo de usuario que se obtiene del login:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "username": "superusuario",
    "nombre": "superusuario",
    "tipo_usuario": "DIRECTIVO",
    "tipo_usuario_display": "Directivo"
  }
}
```

## 🔧 Tipos de Usuario Disponibles

### 1. **DIRECTIVO** - "Directivo"
- Usuarios con permisos administrativos
- Pueden gestionar horarios de otros usuarios
- Acceso completo al sistema

### 2. **PROFESOR** - "Profesor" (posible)
- Usuarios con permisos de profesor
- Pueden gestionar sus propios horarios
- Acceso limitado según su rol

### 3. **ESTUDIANTE** - "Estudiante" (posible)
- Usuarios con permisos de estudiante
- Pueden ver horarios asignados
- Acceso muy limitado

### 4. **ADMIN** - "Administrador" (posible)
- Usuarios con permisos de super administrador
- Control total del sistema
- Pueden gestionar todos los aspectos

## 🎨 Visualización en la Interfaz

### Dashboard Principal
- **Tarjeta de Usuario**: Muestra username y tipo de usuario
- **Información Principal**: Lista completa con ID, usuario, nombre y tipo
- **Header**: Nombre y tipo de usuario en la esquina superior

### Página de Horarios
- **Panel de Usuario**: Muestra nombre, username y tipo con badge
- **Header**: Nombre y tipo de usuario en la navegación
- **Información Contextual**: Tipo de usuario visible en todas las operaciones

## 🔐 Implicaciones de Seguridad

### Permisos por Tipo
- **DIRECTIVO**: Acceso completo a gestión de horarios
- **PROFESOR**: Gestión de horarios propios
- **ESTUDIANTE**: Solo visualización
- **ADMIN**: Control total del sistema

### Validaciones Backend
- El backend debe validar permisos según el tipo de usuario
- Algunas operaciones pueden estar restringidas por tipo
- Los horarios pueden estar asociados a usuarios específicos

## 📊 Estructura de Datos

### Interface Usuario (TypeScript)
```typescript
export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  tipo_usuario: string;           // "DIRECTIVO", "PROFESOR", etc.
  tipo_usuario_display: string;   // "Directivo", "Profesor", etc.
}
```

### Campos
- **tipo_usuario**: Código interno del tipo (para lógica)
- **tipo_usuario_display**: Nombre legible (para interfaz)

## 🎯 Beneficios

### ✅ **Identificación Clara**
- Usuarios saben qué tipo de cuenta tienen
- Interfaz adaptada al rol del usuario

### ✅ **Seguridad Mejorada**
- Validación de permisos por tipo
- Acceso controlado según rol

### ✅ **Experiencia Personalizada**
- Interfaz adaptada al tipo de usuario
- Funcionalidades específicas por rol

### ✅ **Auditoría**
- Registro de acciones por tipo de usuario
- Trazabilidad de operaciones

## 🚀 Próximos Pasos

### Funcionalidades Futuras
1. **Filtros por Tipo**: Mostrar solo horarios relevantes
2. **Permisos Dinámicos**: Controlar acceso según tipo
3. **Interfaz Adaptativa**: Mostrar/ocultar elementos según rol
4. **Reportes por Tipo**: Estadísticas específicas por rol

### Mejoras de UX
1. **Badges de Tipo**: Indicadores visuales del rol
2. **Tooltips Informativos**: Explicar permisos del tipo
3. **Navegación Contextual**: Menús adaptados al rol
4. **Notificaciones Específicas**: Mensajes según tipo de usuario

El sistema ahora proporciona una experiencia más personalizada y segura basada en el tipo de usuario autenticado.
