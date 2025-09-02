import { environment } from '../config/environment';

export interface DirectivoHorarioParams {
  usuario_id?: number;
  dia_semana?: number;
  jornada?: 'M' | 'T';
  sede?: 'SA' | 'BA';
}

export interface DirectivoHorarioResponse {
  total_horarios: number;
  total_monitores: number;
  horarios: Array<{
    id: number;
    usuario: {
      id: number;
      username: string;
      nombre: string;
    };
    dia_semana: number;
    dia_semana_display: string;
    jornada: 'M' | 'T';
    jornada_display: string;
    sede: 'SA' | 'BA';
    sede_display: string;
  }>;
}

export const DirectivoHorariosService = {
  async listarTodos(params: DirectivoHorarioParams, token: string): Promise<DirectivoHorarioResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.usuario_id) {
      searchParams.append('usuario_id', params.usuario_id.toString());
    }
    if (params.dia_semana !== undefined) {
      searchParams.append('dia_semana', params.dia_semana.toString());
    }
    if (params.jornada) {
      searchParams.append('jornada', params.jornada);
    }
    if (params.sede) {
      searchParams.append('sede', params.sede);
    }

    const url = `${environment.backendUrl}/directivo/horarios/${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: No se pudieron obtener los horarios`);
    }

    return response.json();
  }
};
