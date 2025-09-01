# 🔧 Solución para el Error de CORS

## Problema identificado
El error "Failed to fetch" y las peticiones OPTIONS indican un problema de **CORS (Cross-Origin Resource Sharing)**.

## 🚨 Necesitas configurar CORS en tu backend Django

### Paso 1: Instalar django-cors-headers
```bash
pip install django-cors-headers
```

### Paso 2: Agregar a settings.py de Django
```python
# settings.py

# Agregar a INSTALLED_APPS
INSTALLED_APPS = [
    # ... otras apps
    'corsheaders',
    # ... resto de apps
]

# Agregar el middleware (IMPORTANTE: debe estar al principio)
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    # ... resto de middleware
]

# Configuración de CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Para desarrollo, puedes usar (SOLO PARA DESARROLLO):
CORS_ALLOW_ALL_ORIGINS = True

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Métodos permitidos
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Permitir cookies/credenciales
CORS_ALLOW_CREDENTIALS = True
```

### Paso 3: Reiniciar el servidor Django
```bash
python manage.py runserver
```

## 🔄 Alternativa rápida (SOLO para testing)

Si quieres probar rápidamente sin instalar django-cors-headers, puedes agregar esto temporalmente a tu vista de login:

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def login_view(request):
    # Manejar preflight OPTIONS
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    # Tu lógica de login existente aquí
    # ...
    
    # Agregar headers CORS a la respuesta
    response = JsonResponse(your_response_data)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response
```

## ✅ Verificar que funciona

1. Reinicia el servidor Django
2. Recarga la página del frontend
3. Intenta hacer login

## 📋 Checklist de diagnóstico

- [ ] ¿El servidor Django está corriendo en http://127.0.0.1:8000?
- [ ] ¿Instalaste django-cors-headers?
- [ ] ¿Agregaste 'corsheaders' a INSTALLED_APPS?
- [ ] ¿Agregaste CorsMiddleware al principio de MIDDLEWARE?
- [ ] ¿Configuraste CORS_ALLOWED_ORIGINS?
- [ ] ¿Reiniciaste el servidor Django?

## 🔍 Debug adicional

Si el problema persiste, puedes verificar en las herramientas de desarrollador del navegador:

1. Ve a la pestaña **Network**
2. Intenta hacer login
3. Busca la petición a `/login/`
4. Verifica los headers de la respuesta

Deberías ver headers como:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
