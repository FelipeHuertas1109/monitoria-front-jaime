# Guía de Gestión de Horarios

## Descripción
El sistema de gestión de horarios permite crear, visualizar y eliminar horarios múltiples para usuarios autenticados.

## Características

### 1. Creación de Horarios Múltiples
- Permite crear varios horarios en una sola operación
- Formulario dinámico que permite agregar/quitar horarios
- Validación de datos en tiempo real

### 2. Visualización de Horarios
- Tabla con todos los horarios existentes
- Información completa del usuario, día, jornada y sede
- Interfaz intuitiva y responsive

### 3. Eliminación de Horarios
- Eliminación individual con confirmación
- Mensajes de éxito/error informativos

## Endpoints Utilizados

### Crear Horarios Múltiples
```
POST {{url}}horarios/multiple/
Content-Type: application/json
Authorization: Token {token}

{
    "horarios": [
        {
            "dia_semana": 0,
            "jornada": "T",
            "sede": "BA"
        },
        {
            "dia_semana": 0,
            "jornada": "M",
            "sede": "SA"
        }
    ]
}
```

### Obtener Horarios
```
GET {{url}}horarios/
Authorization: Token {token}
```

### Eliminar Horario
```
DELETE {{url}}horarios/{id}/
Authorization: Token {token}
```

## Tipos de Datos

### Días de la Semana
- 0: Lunes
- 1: Martes
- 2: Miércoles
- 3: Jueves
- 4: Viernes
- 5: Sábado
- 6: Domingo

### Jornadas
- M: Mañana
- T: Tarde
- N: Noche

### Sedes
- BA: Barcelona
- SA: San Antonio
- MA: Madrid
- SE: Sevilla

## Navegación

1. **Dashboard Principal**: `/`
   - Pantalla principal con navegación a módulos
   - Tarjeta de "Gestión de Horarios" para acceder al módulo

2. **Gestión de Horarios**: `/horarios`
   - Formulario para crear horarios múltiples
   - Lista de horarios existentes
   - Botón "Volver al Dashboard" en el header

## Seguridad

- Todas las operaciones requieren autenticación con token
- El token se envía automáticamente en las cabeceras
- Manejo de errores 401 (no autorizado) y 403 (sin permisos)
- Redirección automática al login si no está autenticado

## Interfaz de Usuario

- Diseño responsive que se adapta a dispositivos móviles
- Indicadores de carga durante las operaciones
- Notificaciones con SweetAlert2 para feedback al usuario
- Confirmaciones antes de eliminar horarios
- Validación de formularios en tiempo real

## Archivos Creados/Modificados

### Nuevos Archivos
- `types/horarios.ts` - Definiciones de tipos TypeScript
- `services/horarios.ts` - Servicio para comunicación con API
- `components/HorariosManager.tsx` - Componente principal de gestión
- `app/horarios/page.tsx` - Página de la aplicación

### Archivos Modificados
- `components/Dashboard.tsx` - Agregada navegación a horarios

## Uso

1. Iniciar sesión en la aplicación
2. Desde el dashboard, hacer clic en "Gestión de Horarios"
3. Usar el formulario para agregar horarios:
   - Seleccionar día de la semana, jornada y sede
   - Agregar más horarios con el botón "Agregar Horario"
   - Enviar con "Crear Horarios"
4. Ver los horarios creados en la tabla inferior
5. Eliminar horarios individuales si es necesario

## Manejo de Errores

El sistema maneja los siguientes tipos de errores:
- Errores de conexión (CORS, red)
- Errores de autenticación (401, 403)
- Errores de validación (400)
- Errores del servidor (500+)

Todos los errores se muestran al usuario con mensajes claros y sugerencias de solución.
