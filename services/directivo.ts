import { environment } from '../config/environment';
import type { BuscarMonitoresResponse } from '../types/directivo';

export class DirectivoService {
  private static baseUrl = environment.backendUrl;

  static async buscarMonitores(q: string, token: string): Promise<BuscarMonitoresResponse> {
    const params = new URLSearchParams();
    params.set('q', q);
    const url = `${this.baseUrl}/directivo/buscar-monitores/?${params.toString()}`;

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
        const msg = data?.detail || 'Parámetro de búsqueda inválido';
        throw new Error(msg);
      }
      if (response.status === 401 || response.status === 403) throw new Error('Sesión vencida o sin permisos');
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  }
}


