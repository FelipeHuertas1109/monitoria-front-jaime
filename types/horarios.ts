import { Usuario } from './auth';

// Tipos para horarios
export interface HorarioRequest {
  dia_semana: number;
  jornada: string;
  sede: string;
}

export interface HorarioMultipleRequest {
  horarios: HorarioRequest[];
}

export interface Horario {
  id: number;
  usuario: Usuario;
  dia_semana: number;
  dia_semana_display: string;
  jornada: string;
  jornada_display: string;
  sede: string;
  sede_display: string;
}

export interface HorarioMultipleResponse {
  mensaje: string;
  horarios_creados: Horario[];
  total_solicitados: number;
  total_creados: number;
  usuario: Usuario;
}

export interface DiasSemana {
  [key: number]: string;
}

export interface Jornadas {
  [key: string]: string;
}

export interface Sedes {
  [key: string]: string;
}

export const DIAS_SEMANA: DiasSemana = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo'
};

export const JORNADAS: Jornadas = {
  'M': 'Mañana',
  'T': 'Tarde'
};

export const SEDES: Sedes = {
  'BA': 'Barcelona',
  'SA': 'San Antonio'
};
