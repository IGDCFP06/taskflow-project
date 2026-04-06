# TaskFlow (Frontend + Backend REST)

TaskFlow es una aplicación de gestión de tareas con arquitectura separada en frontend y backend.

- Frontend: HTML + Tailwind + JavaScript Vanilla.
- Backend: Node.js + Express + middlewares + arquitectura por capas.
- Persistencia: en memoria (`tasks[]`) en la capa de servicio (sin base de datos, para laboratorio).

## Arquitectura de carpetas

```text
/taskflow-project-configurado
├─ index.html
├─ taskflow.js
├─ src/
│  └─ api/
│     └─ client.js
├─ docs/
│  ├─ backend-api.md
│  └─ integration-tests.md
├─ server/
│  ├─ .env.example
│  ├─ package.json
│  └─ src/
│     ├─ config/
│     │  └─ env.js
│     ├─ controllers/
│     │  └─ task.controller.js
│     ├─ middlewares/
│     │  └─ logger.middleware.js
│     ├─ routes/
│     │  └─ task.routes.js
│     ├─ services/
│     │  └─ task.service.js
│     └─ index.js
├─ api/
│  └─ index.js
└─ vercel.json
```

## Backend: diseño por capas

### 1) Router (`server/src/routes/task.routes.js`)
Responsabilidad:
- Mapear HTTP + URL a controlador.

Rutas:
- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

### 2) Controller (`server/src/controllers/task.controller.js`)
Responsabilidad:
- Leer `req.params` y `req.body`.
- Validar datos en frontera de red.
- Devolver `res.status(...).json(...)` con semántica HTTP correcta.

Validaciones incluidas:
- `title` obligatorio, string, mínimo 3 caracteres.
- `category` dentro de `Estudio | Trabajo | Personal`.
- `priority` dentro de `Baja | Media | Alta`.
- `done` booleano en `PATCH`.
- `dueDate` string o `null`.

### 3) Service (`server/src/services/task.service.js`)
Responsabilidad:
- Lógica de negocio pura (sin Express).
- Gestión del estado en `let tasks = []`.
- Lanza `Error('NOT_FOUND')` cuando no existe una tarea.

## Middlewares

En `server/src/index.js`:

- `cors(...)`: controla orígenes permitidos.
- `express.json()`: parsea JSON de entrada.
- `loggerAcademico`: auditoría de cada petición (`method`, `url`, `status`, tiempo).
- middleware 404: devuelve `{ error: 'Ruta no encontrada' }`.
- middleware global de errores:
  - `NOT_FOUND` -> `404`
  - resto -> `500` con mensaje genérico

También hay una ruta de apoyo para pruebas de error interno en local:
- `GET /api/v1/debug/error` (solo si `NODE_ENV !== 'production'`)

## Variables de entorno

Archivo local: `server/.env`

Ejemplo (plantilla en `server/.env.example`):

```env
PORT=3000
CLIENT_ORIGIN=*
NODE_ENV=development
```

`server/src/config/env.js` valida que `PORT` exista al arrancar.

## Frontend conectado a API

- `src/api/client.js`: capa de comunicación HTTP con `fetch`.
- `taskflow.js`: lógica UI + estados de red.

El frontend gestiona estados:
- `loading`: mostrando mensaje de operación en curso.
- `success`: confirmación visual cuando la operación termina bien.
- `error`: feedback visual cuando backend responde con error o no hay conexión.

La persistencia de tareas ya no usa `localStorage`; ahora depende de la API.

`localStorage` se mantiene solo para preferencias de UI:
- tema
- filtros
- orden
- modo compacto

## API REST: ejemplos rápidos

Base URL local:
- `http://localhost:3000/api/v1/tasks`

### GET /api/v1/tasks
Respuesta `200`:

```json
[
  {
    "id": "uuid",
    "title": "Preparar entrega",
    "category": "Trabajo",
    "priority": "Alta",
    "done": false,
    "dueDate": null,
    "createdAt": 1710000000000,
    "updatedAt": 1710000000000
  }
]
```

### POST /api/v1/tasks
Body:

```json
{
  "title": "Repasar Express",
  "category": "Estudio",
  "priority": "Media",
  "dueDate": null
}
```

Respuesta `201`: tarea creada.

### PATCH /api/v1/tasks/:id
Body:

```json
{
  "done": true
}
```

Respuesta `200`: tarea actualizada.

### DELETE /api/v1/tasks/:id
Respuesta `204` sin body.

## Puesta en marcha local

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Servidor en:
- `http://localhost:3000`

### 2) Frontend

Abre `index.html` en navegador.

Opcional (si quieres cambiar base URL de API):

```html
<script>
  window.TASKFLOW_API_URL = 'http://localhost:3000/api/v1/tasks';
</script>
```

## Pruebas de integración

Revisa `docs/integration-tests.md` para casos completos en Postman/Thunder Client:
- caso válido (`200/201/204`)
- error de validación (`400`)
- recurso inexistente (`404`)
- error interno (`500`)

## Despliegue backend en Vercel

Este proyecto incluye:
- `api/index.js` (adaptador serverless)
- `vercel.json` (rewrite global a la función)

Pasos:

1. Subir repositorio a GitHub.
2. Importar proyecto en Vercel.
3. Configurar variables de entorno en Vercel:
   - `PORT=3000`
   - `CLIENT_ORIGIN=*` (o tu dominio de frontend)
   - `NODE_ENV=production`
4. Desplegar.

Cuando tengas la URL de Vercel, apunta el frontend a esa URL usando `window.TASKFLOW_API_URL`.

## Bonus opcional

- Documentar OpenAPI/Swagger.
- Exportar colección de Postman con tests automáticos.
- Integrar Sentry para monitoreo de errores.
