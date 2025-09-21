'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!token || !user) {
    return null;
  }

  const isDirectivo = user.tipo_usuario === 'DIRECTIVO';
  const isMonitor = user.tipo_usuario === 'MONITOR';

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Sistema de Monitoreo</span>
            </Link>
          </div>

          {/* Navegación principal - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Dashboard principal */}
            <Link
              href="/"
              className="px-3 py-2 rounded-lg text-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 transform hover:scale-110 hover:rotate-3"
              title="Dashboard"
            >
              🏠
            </Link>

            {/* Navegación para Directivos */}
            {isDirectivo && (
              <>
                <Link
                  href="/directivo/asistencias"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-110 hover:-rotate-2"
                  title="Asistencias"
                >
                  👥
                </Link>
                <Link
                  href="/directivo/horarios"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-110 hover:rotate-2"
                  title="Horarios"
                >
                  📅
                </Link>
                <Link
                  href="/directivo/heatmap"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-red-100 hover:text-red-700 transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                  title="Heatmap"
                >
                  🔥
                </Link>
                <Link
                  href="/directivo/reportes"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-purple-100 hover:text-purple-700 transition-all duration-300 transform hover:scale-110 hover:-rotate-1"
                  title="Reportes"
                >
                  📊
                </Link>
                <Link
                  href="/directivo/ajustes-horas"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-yellow-100 hover:text-yellow-700 transition-all duration-300 transform hover:scale-110 hover:rotate-2"
                  title="Ajustes"
                >
                  ⏰
                </Link>
                <Link
                  href="/directivo/finanzas"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-300 transform hover:scale-110 hover:-rotate-2"
                  title="Finanzas"
                >
                  💰
                </Link>
              </>
            )}

            {/* Navegación para Monitores */}
            {isMonitor && (
              <>
                <Link
                  href="/monitor/asistencias"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300 transform hover:scale-110 hover:rotate-2"
                  title="Mis Asistencias"
                >
                  📝
                </Link>
                {/* Horarios para monitores */}
                <Link
                  href="/horarios"
                  className="px-3 py-2 rounded-lg text-lg hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-110 hover:-rotate-1"
                  title="Horarios"
                >
                  📋
                </Link>
              </>
            )}
          </div>

          {/* Usuario y acciones - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">{user.nombre}</span>
                <span className="text-xs text-gray-500">{user.tipo_usuario_display}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Botón de menú móvil */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {/* Dashboard principal */}
              <Link
                href="/"
                className="block px-3 py-2 rounded-lg text-lg hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                onClick={() => setIsMenuOpen(false)}
                title="Dashboard"
              >
                🏠 Dashboard
              </Link>

              {/* Navegación para Directivos */}
              {isDirectivo && (
                <>
                  <Link
                    href="/directivo/asistencias"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Asistencias"
                  >
                    👥 Asistencias
                  </Link>
                  <Link
                    href="/directivo/horarios"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Horarios"
                  >
                    📅 Horarios
                  </Link>
                  <Link
                    href="/directivo/heatmap"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-red-100 hover:text-red-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Heatmap"
                  >
                    🔥 Heatmap
                  </Link>
                  <Link
                    href="/directivo/reportes"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-purple-100 hover:text-purple-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Reportes"
                  >
                    📊 Reportes
                  </Link>
                  <Link
                    href="/directivo/ajustes-horas"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-yellow-100 hover:text-yellow-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Ajustes"
                  >
                    ⏰ Ajustes
                  </Link>
                  <Link
                    href="/directivo/finanzas"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-emerald-100 hover:text-emerald-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Finanzas"
                  >
                    💰 Finanzas
                  </Link>
                </>
              )}

              {/* Navegación para Monitores */}
              {isMonitor && (
                <>
                  <Link
                    href="/monitor/asistencias"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Mis Asistencias"
                  >
                    📝 Mis Asistencias
                  </Link>
                  {/* Horarios para monitores */}
                  <Link
                    href="/horarios"
                    className="block px-3 py-2 rounded-lg text-lg hover:bg-green-100 hover:text-green-700 transition-all duration-300 transform hover:scale-105 hover:translate-x-2"
                    onClick={() => setIsMenuOpen(false)}
                    title="Horarios"
                  >
                    📋 Horarios
                  </Link>
                </>
              )}

              {/* Usuario y logout en móvil */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center space-x-2 px-3 py-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{user.nombre}</span>
                    <span className="text-xs text-gray-500">{user.tipo_usuario_display}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
