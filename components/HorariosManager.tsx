'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { HorarioService } from '../services/horarios';
import { 
  Horario, 
  HorarioRequest, 
  DIAS_SEMANA, 
  JORNADAS, 
  SEDES 
} from '../types/horarios';

export default function HorariosManager() {
  const { token, user } = useAuth();
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingHorarioId, setEditingHorarioId] = useState<number | null>(null);
  const [formHorarios, setFormHorarios] = useState<HorarioRequest[]>([
    { dia_semana: 0, jornada: 'M', sede: 'BA' }
  ]);

  // Cargar horarios al montar el componente
  useEffect(() => {
    if (token) {
      loadHorarios();
    }
  }, [token]);

  const loadHorarios = async () => {
    console.log('loadHorarios - Token disponible:', !!token);
    console.log('loadHorarios - Token value:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
    
    if (!token) {
      console.log('No hay token disponible, saliendo...');
      return;
    }

    try {
      setLoading(true);
      const data = await HorarioService.getAll(token);
      setHorarios(data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Error al cargar horarios',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHorario = () => {
    setFormHorarios([...formHorarios, { dia_semana: 0, jornada: 'M', sede: 'BA' }]);
  };

  const handleRemoveHorario = (index: number) => {
    if (formHorarios.length > 1) {
      const newHorarios = formHorarios.filter((_, i) => i !== index);
      setFormHorarios(newHorarios);
    }
  };

  const handleHorarioChange = (index: number, field: keyof HorarioRequest, value: string | number) => {
    const newHorarios = [...formHorarios];
    newHorarios[index] = { ...newHorarios[index], [field]: value };
    setFormHorarios(newHorarios);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      
      let response;
      if (isEditMode) {
        if (editingHorarioId !== null) {
          // Edición individual
          const updatedHorario = await HorarioService.editSingle(
            editingHorarioId,
            formHorarios[0], // Solo el primer horario en edición individual
            token
          );
          
          await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: `Horario ID ${editingHorarioId} actualizado correctamente`,
            showConfirmButton: true,
          });
        } else {
          // Edición múltiple
          response = await HorarioService.editMultiple(
            { horarios: formHorarios },
            token
          );
          
          await Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: response.mensaje,
            showConfirmButton: true,
          });
        }
      } else {
        // Creación múltiple
        response = await HorarioService.createMultiple(
          { horarios: formHorarios },
          token
        );
        
        await Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: response.mensaje,
          showConfirmButton: true,
        });
      }

      // Resetear formulario
      setFormHorarios([{ dia_semana: 0, jornada: 'M', sede: 'BA' }]);
      setIsEditMode(false);
      setEditingHorarioId(null);
      
      // Recargar horarios
      await loadHorarios();

    } catch (error) {
      const action = isEditMode ? 'editar' : 'crear';
      console.error(`Error al ${action} horarios:`, error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : `Error al ${action} horarios`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHorario = async (id: number) => {
    if (!token) return;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        await HorarioService.delete(id, token);
        
        await Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El horario ha sido eliminado correctamente',
          timer: 1500,
          showConfirmButton: false
        });

        await loadHorarios();
      } catch (error) {
        console.error('Error al eliminar horario:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error instanceof Error ? error.message : 'Error al eliminar horario',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditAllHorarios = () => {
    if (horarios.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay horarios',
        text: 'No hay horarios existentes para editar',
      });
      return;
    }

    // Convertir horarios existentes a formato del formulario
    const horariosToEdit = horarios.map(horario => ({
      dia_semana: horario.dia_semana,
      jornada: horario.jornada,
      sede: horario.sede
    }));

    setFormHorarios(horariosToEdit);
    setIsEditMode(true);

    // Scroll hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Swal.fire({
      icon: 'info',
      title: 'Modo de edición activado',
      text: 'Modifica los horarios en el formulario y presiona "Actualizar Horarios"',
      timer: 3000,
      showConfirmButton: false
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingHorarioId(null);
    setFormHorarios([{ dia_semana: 0, jornada: 'M', sede: 'BA' }]);
    
    Swal.fire({
      icon: 'info',
      title: 'Edición cancelada',
      text: 'Se ha cancelado la edición de horarios',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const handleEditSingleHorario = async (horario: Horario) => {
    // Configurar el formulario para editar este horario específico
    setFormHorarios([{
      dia_semana: horario.dia_semana,
      jornada: horario.jornada,
      sede: horario.sede
    }]);
    setIsEditMode(true);
    setEditingHorarioId(horario.id);

    // Scroll hacia el formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });

    Swal.fire({
      icon: 'info',
      title: 'Editando horario individual',
      text: `Editando horario ID ${horario.id}. Modifica los datos y presiona "Actualizar Horario"`,
      timer: 3000,
      showConfirmButton: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-800">
                  <span className="font-semibold">Usuario:</span> {user.nombre} ({user.username})
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  <span className="font-medium">Tipo:</span> {user.tipo_usuario_display}
                </p>
              </div>
              <div className="bg-blue-100 px-3 py-1 rounded-full">
                <span className="text-blue-800 text-sm font-medium">
                  {user.tipo_usuario}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para crear horarios múltiples */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {isEditMode 
              ? (editingHorarioId !== null 
                  ? `Editar Horario ID ${editingHorarioId}` 
                  : 'Editar Todos los Horarios')
              : 'Crear Horarios Múltiples'
            }
          </h2>

          <form onSubmit={handleSubmit}>
            {formHorarios.map((horario, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">Horario {index + 1}</h3>
                  {formHorarios.length > 1 && editingHorarioId === null && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHorario(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Día de la Semana
                    </label>
                    <select
                      value={horario.dia_semana}
                      onChange={(e) => handleHorarioChange(index, 'dia_semana', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    >
                      {Object.entries(DIAS_SEMANA).map(([key, value]) => (
                        <option key={key} value={key} className="text-gray-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Jornada
                    </label>
                    <select
                      value={horario.jornada}
                      onChange={(e) => handleHorarioChange(index, 'jornada', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    >
                      {Object.entries(JORNADAS).map(([key, value]) => (
                        <option key={key} value={key} className="text-gray-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Sede
                    </label>
                    <select
                      value={horario.sede}
                      onChange={(e) => handleHorarioChange(index, 'sede', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      required
                    >
                      {Object.entries(SEDES).map(([key, value]) => (
                        <option key={key} value={key} className="text-gray-900">
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 mt-6">
              {!isEditMode && (
                <button
                  type="button"
                  onClick={handleAddHorario}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Agregar Horario
                </button>
              )}

              {isEditMode && editingHorarioId === null && (
                <button
                  type="button"
                  onClick={handleAddHorario}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Agregar Horario
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading 
                  ? (isEditMode ? 'Actualizando...' : 'Creando...') 
                  : (isEditMode 
                      ? (editingHorarioId !== null ? 'Actualizar Horario' : 'Actualizar Horarios')
                      : 'Crear Horarios')
                }
              </button>

              {isEditMode && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de horarios existentes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Horarios Existentes
            </h2>
            {!loading && horarios.length > 0 && !isEditMode && (
              <button
                onClick={handleEditAllHorarios}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Editar Todos
              </button>
            )}
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-600 mt-2">Cargando...</p>
            </div>
          )}

          {!loading && horarios.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay horarios registrados
            </div>
          )}

          {!loading && horarios.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Usuario</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Día</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Jornada</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Sede</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((horario) => (
                    <tr key={horario.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <span className="font-medium">{horario.usuario.nombre}</span> 
                        <span className="text-gray-600">({horario.usuario.username})</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{horario.dia_semana_display}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{horario.jornada_display}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">{horario.sede_display}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {!isEditMode && (
                            <button
                              onClick={() => handleEditSingleHorario(horario)}
                              className="text-blue-500 hover:text-blue-700 font-medium"
                              disabled={loading}
                            >
                              Editar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteHorario(horario.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                            disabled={loading}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
