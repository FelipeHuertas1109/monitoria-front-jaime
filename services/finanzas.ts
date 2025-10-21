import { environment } from '../config/environment';
import type {
  ReporteFinancieroMonitor,
  ReporteFinancieroTodos,
  ResumenEjecutivo,
  ComparativaSemanas,
  ListaConfiguraciones,
  Configuracion,
  CrearConfiguracionRequest,
  ActualizarConfiguracionRequest,
  InicializarConfiguracionesResponse,
  FinanzasQuery,
} from '../types/finanzas';

export class FinanzasService {
  private static baseUrl = environment.backendUrl;

  // Reporte financiero individual de monitor
  static async reporteFinancieroMonitor(
    monitorId: number,
    query: FinanzasQuery,
    token: string
  ): Promise<ReporteFinancieroMonitor> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);
    if (query.semanas_trabajadas !== undefined) params.set('semanas_trabajadas', query.semanas_trabajadas.toString());
    if (query.sede) params.set('sede', query.sede);
    if (query.jornada) params.set('jornada', query.jornada);
    
    const url = `${this.baseUrl}/directivo/finanzas/monitor/${monitorId}/?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Parámetros de consulta inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      if (response.status === 404) {
        throw new Error('Monitor no encontrado');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  // Reporte financiero de todos los monitores
  static async reporteFinancieroTodos(
    query: FinanzasQuery,
    token: string
  ): Promise<ReporteFinancieroTodos> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);
    if (query.semanas_trabajadas !== undefined) params.set('semanas_trabajadas', query.semanas_trabajadas.toString());
    if (query.sede) params.set('sede', query.sede);
    if (query.jornada) params.set('jornada', query.jornada);
    
    const url = `${this.baseUrl}/directivo/finanzas/todos-monitores/?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Parámetros de consulta inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  // Resumen ejecutivo financiero
  static async resumenEjecutivo(
    query: FinanzasQuery,
    token: string
  ): Promise<ResumenEjecutivo> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);
    if (query.semanas_trabajadas !== undefined) params.set('semanas_trabajadas', query.semanas_trabajadas.toString());
    if (query.sede) params.set('sede', query.sede);
    if (query.jornada) params.set('jornada', query.jornada);
    
    const url = `${this.baseUrl}/directivo/finanzas/resumen-ejecutivo/?${params.toString()}`;
    
    console.log('FinanzasService.resumenEjecutivo - URL:', url);
    console.log('FinanzasService.resumenEjecutivo - Base URL:', this.baseUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      console.error('FinanzasService.resumenEjecutivo - Error response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Parámetros de consulta inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      if (response.status === 404) {
        throw new Error('Endpoint no encontrado (404) - Verifica que la URL base esté configurada correctamente');
      }
      throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
    }
    return response.json();
  }

  // Comparativa por semanas
  static async comparativaSemanas(
    token: string
  ): Promise<ComparativaSemanas> {
    const url = `${this.baseUrl}/directivo/finanzas/comparativa-semanas/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Parámetros de consulta inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  // Configuraciones del sistema
  static async listarConfiguraciones(token: string): Promise<ListaConfiguraciones> {
    const url = `${this.baseUrl}/directivo/configuraciones/`;
    
    console.log('FinanzasService.listarConfiguraciones - URL:', url);
    console.log('FinanzasService.listarConfiguraciones - Base URL:', this.baseUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async crearConfiguracion(
    data: CrearConfiguracionRequest,
    token: string
  ): Promise<Configuracion> {
    const url = `${this.baseUrl}/directivo/configuraciones/crear/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Datos de configuración inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async inicializarConfiguraciones(token: string): Promise<InicializarConfiguracionesResponse> {
    const url = `${this.baseUrl}/directivo/configuraciones/inicializar/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async obtenerConfiguracion(
    clave: string,
    token: string
  ): Promise<Configuracion> {
    const url = `${this.baseUrl}/directivo/configuraciones/${clave}/`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Configuración no encontrada');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async actualizarConfiguracion(
    clave: string,
    data: ActualizarConfiguracionRequest,
    token: string
  ): Promise<Configuracion> {
    const url = `${this.baseUrl}/directivo/configuraciones/${clave}/`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Datos de configuración inválidos';
        throw new Error(msg);
      }
      if (response.status === 404) {
        throw new Error('Configuración no encontrada');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async eliminarConfiguracion(
    clave: string,
    token: string
  ): Promise<void> {
    const url = `${this.baseUrl}/directivo/configuraciones/${clave}/`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Configuración no encontrada');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
  }

  // Obtener total de horas de horarios
  static async totalHorasHorarios(
    token: string,
    sede?: string,
    jornada?: string,
    monitorId?: number
  ): Promise<any> {
    const params = new URLSearchParams();
    if (sede) params.set('sede', sede);
    if (jornada) params.set('jornada', jornada);
    if (monitorId) params.set('monitor_id', monitorId.toString());
    
    const url = `${this.baseUrl}/directivo/total-horas-horarios/?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const msg = data?.detail || 'Parámetros de consulta inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Sesión vencida o sin permisos');
      }
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return response.json();
  }
}
