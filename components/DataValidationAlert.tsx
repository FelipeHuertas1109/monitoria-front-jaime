'use client';

import React, { useState } from 'react';
import { ValidationResult, generateValidationSummary, getValidationColor } from '../utils/dataValidation';

interface DataValidationAlertProps {
  validationResult: ValidationResult | null;
  onRefresh?: () => void;
  className?: string;
}

export default function DataValidationAlert({ 
  validationResult, 
  onRefresh, 
  className = '' 
}: DataValidationAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!validationResult) {
    return null;
  }

  const hasWarnings = validationResult.warnings.length > 0;
  const colorClass = getValidationColor(validationResult.isValid, hasWarnings);
  const iconClass = validationResult.isValid ? 'text-green-500' : 'text-red-500';

  return (
    <div className={`bg-white border rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 ${iconClass}`}>
            {validationResult.isValid ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div>
            <h3 className={`text-sm font-medium ${colorClass}`}>
              {validationResult.isValid ? 'Datos Sincronizados' : 'Discrepancias Detectadas'}
            </h3>
            <p className="text-xs text-gray-600">
              {validationResult.isValid 
                ? 'Los datos están consistentes entre todos los módulos'
                : `${validationResult.discrepancies.length} discrepancia(s) encontrada(s)`
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              Verificar
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? 'Ocultar' : 'Detalles'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {generateValidationSummary(validationResult)}
          </div>
          
          {validationResult.discrepancies.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Detalles de Discrepancias:</h4>
              <div className="space-y-2">
                {validationResult.discrepancies.map((discrepancy, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">
                        {discrepancy.type === 'hours' ? 'Horas' : 
                         discrepancy.type === 'asistencias' ? 'Asistencias' :
                         discrepancy.type === 'ajustes' ? 'Ajustes' : 'Período'}
                      </span>
                      <span className="text-xs text-red-600">
                        {discrepancy.module === 'reportes' ? 'Reportes' : 'Finanzas'}
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{discrepancy.description}</p>
                    {discrepancy.type === 'hours' && (
                      <div className="text-xs text-red-600 mt-1">
                        Esperado: {(() => {
                          const valor = Number(discrepancy.expectedValue);
                          return isNaN(valor) ? '0.00' : valor.toFixed(2);
                        })()}h | 
                        Actual: {(() => {
                          const valor = Number(discrepancy.actualValue);
                          return isNaN(valor) ? '0.00' : valor.toFixed(2);
                        })()}h | 
                        Diferencia: {(() => {
                          const valor = Number(discrepancy.difference);
                          return isNaN(valor) ? '0.00' : valor.toFixed(2);
                        })()}h
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Advertencias:</h4>
              <div className="space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                    • {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
