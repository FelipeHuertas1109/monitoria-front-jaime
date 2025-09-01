'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth';
import { AuthContextType, LoginRequest, RegisterRequest, Usuario } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la aplicación
    const savedToken = Cookies.get('authToken');
    const savedUser = Cookies.get('authUser');
    
    console.log('AuthContext - Token desde cookies:', savedToken ? `${savedToken.substring(0, 10)}...` : 'NO TOKEN');
    console.log('AuthContext - Usuario desde cookies:', savedUser ? 'SI' : 'NO');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      console.log('AuthContext - Token y usuario restaurados desde cookies');
    } else {
      console.log('AuthContext - No hay token o usuario en cookies');
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await AuthService.login(credentials);
      
      // Guardar token y usuario en cookies
      Cookies.set('authToken', response.token, { expires: 7 }); // 7 días
      Cookies.set('authUser', JSON.stringify(response.usuario), { expires: 7 });
      
      setToken(response.token);
      setUser(response.usuario);

      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Hola ${response.usuario.nombre}, has iniciado sesión correctamente`,
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: error instanceof Error ? error.message : 'Error desconocido',
      });
      throw error;
    }
  };

  const register = async (credentials: RegisterRequest) => {
    try {
      const response = await AuthService.register(credentials);
      
      // Mostrar mensaje de éxito
      await Swal.fire({
        icon: 'success',
        title: '¡Registro exitoso!',
        text: response.mensaje,
        showConfirmButton: true,
      });
      
      console.log('Registro exitoso:', response.mensaje);
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Error de registro',
        text: error instanceof Error ? error.message : 'Error desconocido',
      });
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('authToken');
    Cookies.remove('authUser');
    setToken(null);
    setUser(null);

    Swal.fire({
      icon: 'info',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión correctamente',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
