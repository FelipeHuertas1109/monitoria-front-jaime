// Tipos para autenticación
export interface LoginRequest {
  nombre_de_usuario: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  nombre: string;
  password: string;
  confirm_password: string;
}

export interface Usuario {
  id: number;
  username: string;
  nombre: string;
  tipo_usuario: string;
  tipo_usuario_display: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface RegisterResponse {
  mensaje: string;
  usuario: Usuario;
}

export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
