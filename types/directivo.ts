export interface MonitorBasico {
  id: number;
  username: string;
  nombre: string;
}

export interface BuscarMonitoresResponse {
  busqueda: string;
  total_encontrados: number;
  monitores: MonitorBasico[];
}


