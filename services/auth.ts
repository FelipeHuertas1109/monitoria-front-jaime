import { environment } from '../config/environment';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';

export class AuthService {
  private static baseUrl = environment.backendUrl;

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('Intentando login con URL:', `${this.baseUrl}/login/`);
    console.log('Credenciales:', { nombre_de_usuario: credentials.nombre_de_usuario });

    try {
      const response = await fetch(`${this.baseUrl}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Credenciales inválidas');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data: LoginResponse = await response.json();
      console.log('Login exitoso:', { usuario: data.usuario.nombre });
      return data;
    } catch (error) {
      console.error('Fetch error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django (ver archivo SOLUCION_CORS.md)
3. Instala django-cors-headers y configura CORS_ALLOW_ALL_ORIGINS = True`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }

  static async register(credentials: RegisterRequest): Promise<RegisterResponse> {
    console.log('Intentando registro con URL:', `${this.baseUrl}/registro/`);
    console.log('Datos de registro:', { username: credentials.username, nombre: credentials.nombre });

    try {
      const response = await fetch(`${this.baseUrl}/registro/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 400) {
          throw new Error('Datos de registro inválidos');
        } else if (response.status === 409) {
          throw new Error('El nombre de usuario ya existe');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data: RegisterResponse = await response.json();
      console.log('Registro exitoso:', { usuario: data.usuario.nombre });
      return data;
    } catch (error) {
      console.error('Fetch error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django (ver archivo SOLUCION_CORS.md)
3. Instala django-cors-headers y configura CORS_ALLOW_ALL_ORIGINS = True`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }
}
