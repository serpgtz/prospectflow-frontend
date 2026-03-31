# Entornos y Despliegue Seguro

## Objetivo
Usar el mismo codigo en local y produccion, cambiando solo configuracion por entorno.

## Frontend (este repo)
- Variable requerida: `VITE_API_URL`
- Local: `http://localhost:3000`
- Produccion: URL publica de tu backend

Ejemplo local:
```bash
cp .env.local.example .env.local
```

Ejemplo produccion (en tu plataforma):
- Crea variable `VITE_API_URL=https://tu-api-produccion.com`

## Backend (repo backend-ventas)
Variables minimas esperadas:
- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_DIALECT`
- `JWT_SECRET`

Nunca subir `.env` con secretos al repo.

## Flujo recomendado de ramas
- `main`: produccion
- `develop`: integracion/staging
- `feature/*`: trabajo diario

Regla: despliegue automatico solo desde `main`.

## Checklist antes de merge a main
1. Build de frontend en verde (`npm run build`).
2. Endpoints frontend usando prefijo `/api/...`.
3. Sin URLs hardcodeadas de localhost en codigo.
4. Variables de entorno configuradas en produccion.
5. PR revisado y merge a `main` cuando todo este validado.
