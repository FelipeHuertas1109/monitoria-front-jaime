import { Usuario } from './auth';

export interface ListarAjustesHorasQuery {
  monitor_id?: number;
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
}

export interface AjusteHoras {
  id: number;
  usuario: Pick<Usuario, 'id' | 'username' | 'nombre'>;
  fecha: string; // YYYY-MM-DD
  cantidad_horas: number; // positivo suma, negativo resta
  motivo: string;
  asistencia: null | {
    id: number;
    fecha: string;
    presente: boolean;
    estado_autorizacion: 'pendiente' | 'autorizado' | 'rechazado';
  };
  creado_por: Pick<Usuario, 'id' | 'username' | 'nombre'>;
  created_at: string; // ISO
  updated_at: string; // ISO
}

export interface ListarAjustesHorasResponse {
  periodo: {
    fecha_inicio: string;
    fecha_fin: string;
  };
  estadisticas: {
    total_ajustes: number;
    total_horas_ajustadas: number;
    monitores_afectados: number;
  };
  filtros_aplicados: {
    monitor_id: number | null;
  };
  ajustes: AjusteHoras[];
}

export interface CrearAjusteHorasRequest {
  monitor_id: number;
  fecha: string; // YYYY-MM-DD
  cantidad_horas: number; // -24.00 a 24.00, != 0
  motivo: string;
  asistencia_id?: number | null;
}

export type CrearAjusteHorasResponse = AjusteHoras;


