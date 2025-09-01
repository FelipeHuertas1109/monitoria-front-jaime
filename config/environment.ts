// Configuración del entorno - exige uso de variable de entorno pública

function normalizeBackendUrl(raw?: string): string {
  if (!raw) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL no está definido. Configura .env.local');
  }
  let url = raw.trim();
  // Agregar protocolo si falta
  if (!/^https?:\/\//i.test(url)) {
    console.warn('NEXT_PUBLIC_BACKEND_URL sin protocolo, usando https:// por defecto');
    url = `https://${url}`;
  }
  // Quitar barra final
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

export const environment = {
  backendUrl: normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL),
};
