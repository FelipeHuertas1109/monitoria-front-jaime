import { environment } from '../config/environment';
import { Horario, HorarioRequest, HorarioMultipleRequest, HorarioMultipleResponse } from '../types/horarios';

export class HorarioService {
  private static baseUrl = environment.backendUrl;

  // Crear múltiples horarios
  static async createMultiple(
    horariosData: HorarioMultipleRequest,
    token: string
  ): Promise<HorarioMultipleResponse> {
    console.log('Creando horarios múltiples con URL:', `${this.baseUrl}/horarios/multiple/`);
    console.log('Datos de horarios:', horariosData);

    try {
      const response = await fetch(`${this.baseUrl}/horarios/multiple/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
        body: JSON.stringify(horariosData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de autenticación inválido');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para crear horarios');
        } else if (response.status === 400) {
          throw new Error('Datos de horarios inválidos');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data: HorarioMultipleResponse = await response.json();
      console.log('Horarios creados exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django
3. Verifica que el token de autenticación sea válido`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }

  // Editar múltiples horarios
  static async editMultiple(
    horariosData: HorarioMultipleRequest,
    token: string
  ): Promise<HorarioMultipleResponse> {
    console.log('Editando horarios múltiples con URL:', `${this.baseUrl}/horarios/edit-multiple/`);
    console.log('Datos de horarios a editar:', horariosData);

    // Intentar diferentes métodos HTTP ya que 405 indica método no permitido
    const methodsToTry = ['PUT', 'PATCH', 'POST'];
    let lastError: Error | null = null;
    
    for (const method of methodsToTry) {
      console.log(`🔄 Intentando edición múltiple con método ${method}...`);
      
      try {
        const response = await fetch(`${this.baseUrl}/horarios/edit-multiple/`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          mode: 'cors',
          body: JSON.stringify(horariosData),
        });

        console.log(`📊 Response status con ${method}:`, response.status);
        
        // Si es 405, continuar con el siguiente método
        if (response.status === 405) {
          console.log(`❌ Método ${method} no permitido (405), probando siguiente...`);
          continue;
        }

        // Si llegamos aquí, el método fue aceptado (no es 405)
        console.log(`✅ Método ${method} aceptado por el servidor`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          if (response.status === 401) {
            throw new Error('Token de autenticación inválido');
          } else if (response.status === 403) {
            throw new Error('No tienes permisos para editar horarios');
          } else if (response.status === 400) {
            throw new Error('Datos de horarios inválidos');
          } else if (response.status >= 500) {
            throw new Error('Error interno del servidor');
          } else {
            throw new Error(`Error del servidor: ${response.status}`);
          }
        }

        // Éxito!
        const data: HorarioMultipleResponse = await response.json();
        console.log(`🎉 Horarios editados exitosamente con método ${method}:`, data);
        return data;

      } catch (fetchError) {
        console.error(`❌ Error con método ${method}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error('Error desconocido');
        
        // Si es un error de red o similar (no relacionado con el método HTTP), 
        // no tiene sentido probar otros métodos
        if (fetchError instanceof TypeError) {
          throw fetchError;
        }
      }
    }

    // Si todos los métodos fallan con 405, intentar alternativa
    console.log('🔄 Todos los métodos HTTP fallaron con 405. Intentando método alternativo...');
    console.log('📋 Método alternativo: eliminar todos los horarios y crear nuevos');
    
    try {
      // Obtener horarios actuales
      console.log('📋 Paso 1: Obteniendo horarios actuales...');
      const horariosActuales = await this.getAll(token);
      console.log(`📊 Encontrados ${horariosActuales.length} horarios existentes`);
      
      // Eliminar todos los horarios existentes
      console.log('🗑️ Paso 2: Eliminando horarios existentes...');
      for (const horario of horariosActuales) {
        console.log(`🗑️ Eliminando horario ID ${horario.id}`);
        await this.delete(horario.id, token);
      }
      console.log('✅ Todos los horarios existentes eliminados');
      
      // Crear los nuevos horarios
      console.log('➕ Paso 3: Creando nuevos horarios...');
      const response = await this.createMultiple(horariosData, token);
      
      console.log('🎉 Edición múltiple completada exitosamente usando método alternativo');
      return {
        ...response,
        mensaje: `${response.mensaje} (editado usando método alternativo: eliminar y recrear)`
      };
      
    } catch (alternativeError) {
      console.error('Error en método alternativo:', alternativeError);
      throw new Error(`No se pudo editar los horarios. 
      
❌ Endpoint /horarios/edit-multiple/ no disponible
❌ Método alternativo falló: ${alternativeError instanceof Error ? alternativeError.message : 'Error desconocido'}

🔧 Soluciones:
1. Verifica que el backend tenga implementado el endpoint /horarios/edit-multiple/
2. Contacta al desarrollador del backend para confirmar la funcionalidad
3. Usa la edición individual para cada horario`);
    }
  }

  // Obtener todos los horarios
  static async getAll(token: string): Promise<Horario[]> {
    console.log('Obteniendo horarios con URL:', `${this.baseUrl}/horarios/`);
    console.log('Token recibido:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');

    try {
      // JWT requiere formato Bearer
      console.log('Enviando con formato JWT Bearer...');
      const response = await fetch(`${this.baseUrl}/horarios/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      console.log('Headers enviados:', {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 10)}...`,
        'Content-Type': 'application/json',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de autenticación inválido');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para ver horarios');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data: Horario[] = await response.json();
      console.log('Horarios obtenidos exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django
3. Verifica que el token de autenticación sea válido`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }

  // Editar un horario individual
  static async editSingle(
    id: number,
    horarioData: HorarioRequest,
    token: string
  ): Promise<Horario> {
    console.log('Editando horario individual con URL:', `${this.baseUrl}/horarios/${id}/`);
    console.log('Datos del horario a editar:', horarioData);

    try {
      const response = await fetch(`${this.baseUrl}/horarios/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
        body: JSON.stringify(horarioData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de autenticación inválido');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para editar este horario');
        } else if (response.status === 404) {
          throw new Error('Horario no encontrado');
        } else if (response.status === 400) {
          throw new Error('Datos del horario inválidos');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      const data: Horario = await response.json();
      console.log('Horario editado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('Error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django
3. Verifica que el token de autenticación sea válido`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }

  // Eliminar un horario
  static async delete(id: number, token: string): Promise<void> {
    console.log('Eliminando horario con URL:', `${this.baseUrl}/horarios/${id}/`);

    try {
      const response = await fetch(`${this.baseUrl}/horarios/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        mode: 'cors',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Token de autenticación inválido');
        } else if (response.status === 403) {
          throw new Error('No tienes permisos para eliminar horarios');
        } else if (response.status === 404) {
          throw new Error('Horario no encontrado');
        } else if (response.status >= 500) {
          throw new Error('Error interno del servidor');
        } else {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }

      console.log('Horario eliminado exitosamente');
    } catch (error) {
      console.error('Error completo:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Error de CORS o conexión. 
        
🔧 Soluciones:
1. Verifica que el backend esté ejecutándose en ${this.baseUrl}
2. Configura CORS en tu backend Django
3. Verifica que el token de autenticación sea válido`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Error de conexión desconocido');
    }
  }
}
