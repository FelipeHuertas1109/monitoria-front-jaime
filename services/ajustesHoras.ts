import { environment } from '../config/environment';
import {
  AjusteHoras,
  CrearAjusteHorasRequest,
  CrearAjusteHorasResponse,
  ListarAjustesHorasQuery,
  ListarAjustesHorasResponse,
} from '../types/ajustesHoras';

export class AjustesHorasService {
  private static baseUrl = environment.backendUrl;

  static async listar(query: ListarAjustesHorasQuery, token: string): Promise<ListarAjustesHorasResponse> {
    const params = new URLSearchParams();
    if (query.monitor_id !== undefined) params.set('monitor_id', String(query.monitor_id));
    if (query.fecha_inicio) params.set('fecha_inicio', query.fecha_inicio);
    if (query.fecha_fin) params.set('fecha_fin', query.fecha_fin);

    const url = `${this.baseUrl}/directivo/ajustes-horas/${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('Sesión vencida o sin permisos');
      if (response.status === 400) throw new Error('Parámetros inválidos');
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async crear(payload: CrearAjusteHorasRequest, token: string): Promise<CrearAjusteHorasResponse> {
    const url = `${this.baseUrl}/directivo/ajustes-horas/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 400) {
        const data = await response.json().catch(() => ({}));
        const first = typeof data === 'object' && data ? Object.values(data)[0] : undefined;
        const msg = Array.isArray(first) ? String(first[0]) : 'Datos inválidos';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) throw new Error('Sesión vencida o sin permisos');
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async obtener(id: number, token: string): Promise<AjusteHoras> {
    const url = `${this.baseUrl}/directivo/ajustes-horas/${id}/`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('Ajuste no encontrado');
      if (response.status === 401 || response.status === 403) throw new Error('Sesión vencida o sin permisos');
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }

  static async eliminar(id: number, token: string): Promise<void> {
    const url = `${this.baseUrl}/directivo/ajustes-horas/${id}/`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      mode: 'cors',
    });
    if (!response.ok && response.status !== 204) {
      if (response.status === 404) throw new Error('Ajuste no encontrado');
      if (response.status === 401 || response.status === 403) throw new Error('Sesión vencida o sin permisos');
      throw new Error(`Error del servidor: ${response.status}`);
    }
  }
}


