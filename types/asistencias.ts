import { Usuario } from './auth';

// Estados y catálogos
export type EstadoAutorizacion = 'pendiente' | 'autorizado' | 'rechazado';
export type Jornada = 'M' | 'T';
export type Sede = 'SA' | 'BA';

// Entidades
export interface Horario {
  id: number;
  usuario: Pick<Usuario, 'id' | 'nombre' | 'username' | 'tipo_usuario' | 'tipo_usuario_display'>;
  dia_semana: number;
  dia_semana_display: string;
  jornada: Jornada;
  jornada_display: string;
  sede: Sede;
  sede_display: string;
}

export interface Asistencia {
  id: number;
  usuario: Pick<Usuario, 'id' | 'nombre' | 'username' | 'tipo_usuario' | 'tipo_usuario_display'>;
  fecha: string; // YYYY-MM-DD
  horario: Horario;
  presente: boolean;
  estado_autorizacion: EstadoAutorizacion;
  estado_autorizacion_display: string;
  horas: number;
}

// Directivo: listar asistencias
export interface ListarAsistenciasQuery {
  fecha: string; // YYYY-MM-DD
  estado?: EstadoAutorizacion | '';
  jornada?: Jornada | '';
  sede?: Sede | '';
}

export interface ListarAsistenciasResponse {
  resultados: Asistencia[];
  // Posible paginación si el backend la incluye en el futuro
  total?: number;
  pagina?: number;
  paginas?: number;
}

// Directivo: autorizar / rechazar
export interface AccionAsistenciaResponse extends Asistencia {}

// Monitor: ver mis asistencias
export interface MisAsistenciasQuery {
  fecha: string; // YYYY-MM-DD
}

export type MisAsistenciasResponse = Asistencia[];

// Monitor: marcar presente
export interface MarcarPresenteRequest {
  fecha: string; // YYYY-MM-DD
  jornada: Jornada;
}

export interface MarcarPresenteResponse extends Asistencia {}


