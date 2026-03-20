# TaskFlow – Fase backend con Express

TaskFlow pasa de ser una aplicación frontend con persistencia local a una solución cliente-servidor. El frontend sigue siendo HTML + Tailwind + JavaScript, pero ahora las tareas se almacenan en un backend Node.js con Express y se consumen mediante una API RESTful.

## Qué se ha implementado

### Backend
- Servidor Express en `server/`
- Arquitectura por capas: `routes`, `controllers`, `services`
- Variables de entorno con `dotenv`
- Middleware `express.json()` para parseo de JSON
- Middleware de `cors()` para permitir peticiones desde el frontend
- Middleware de auditoría `loggerAcademico`
- Middleware global de errores
- API RESTful bajo `/api/v1/tasks`
- Persistencia simulada en memoria con `let tasks = []`

### Frontend
- Eliminada la persistencia de tareas en `localStorage`
- Nueva capa de red en `src/api/client.js`
- Consumo del backend con `fetch`
- Estados visuales de carga, éxito y error
- La UI mantiene filtros, búsqueda, edición, marcado y borrado
- Se conserva `localStorage` solo para preferencias visuales (tema y filtros), no para almacenar tareas

## Estructura del proyecto

```text
TaskFlow/
├── index.html
├── taskflow.js
├── src/
│   └── api/
│       └── client.js
├── docs/
│   ├── backend-api.md
│   └── ai/
│       ├── ai-development-workflow.md
│       └── experiments.md
├── server/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── env.js
│       ├── controllers/
│       │   └── task.controller.js
│       ├── middlewares/
│       │   └── logger.middleware.js
│       ├── routes/
│       │   └── task.routes.js
│       ├── services/
│       │   └── task.service.js
│       └── index.js
└── vercel.json
```

## Arquitectura por capas

### 1. Routes
Reciben la URL y el verbo HTTP y delegan al controlador correcto.

- `GET /api/v1/tasks`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

### 2. Controllers
Son la frontera HTTP. Aquí se:

- leen `req.params` y `req.body`
- validan los datos del cliente
- devuelven códigos HTTP correctos
- llaman a la capa de servicios

### 3. Services
Contienen la lógica de negocio pura y la persistencia simulada.

- `getAllTasks()`
- `createTask(data)`
- `updateTask(id, updates)`
- `deleteTask(id)`

Si un recurso no existe, el servicio lanza `throw new Error('NOT_FOUND')` para que el middleware global lo traduzca a HTTP 404.

## Middlewares usados

### `express.json()`
Transforma el JSON crudo recibido por la red en objetos JavaScript accesibles desde `req.body`.

### `cors()`
Permite que el navegador del frontend pueda consumir la API del backend aunque se sirvan desde orígenes distintos.

### `loggerAcademico`
Registra método HTTP, URL, código de estado y duración de la petición. Es útil para auditoría, depuración y análisis de rendimiento.

### Middleware global de errores
Va al final de `server/src/index.js` y traduce errores del servicio a respuestas HTTP seguras:

- `NOT_FOUND` → `404`
- cualquier otro error → `500 Error interno del servidor`

## Variables de entorno

Archivo de ejemplo:

```env
PORT=3000
CLIENT_ORIGIN=http://127.0.0.1:5500
```

Regla importante: el archivo `.env` real no debe subirse al repositorio. Por eso se incluye en `server/.gitignore`.

## Cómo arrancar el backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

El servidor quedará disponible en:

```text
http://localhost:3000
```

## Cómo abrir el frontend

Puedes abrir `index.html` con Live Server o con cualquier servidor estático sencillo. El frontend consumirá:

```text
http://localhost:3000/api/v1/tasks
```

## Endpoints de la API

### `GET /api/v1/tasks`
Devuelve todas las tareas.

Ejemplo de respuesta:

```json
[
  {
    "id": "abc123",
    "title": "Preparar presentación",
    "category": "Trabajo",
    "priority": "Alta",
    "dueDate": "2026-03-25",
    "done": false,
    "createdAt": 1760000000000,
    "updatedAt": 1760000000000
  }
]
```

### `POST /api/v1/tasks`
Crea una nueva tarea.

Body de ejemplo:

```json
{
  "title": "Repasar Express",
  "category": "Estudio",
  "priority": "Alta",
  "dueDate": "2026-03-21"
}
```

Respuesta correcta:
- `201 Created`

### `PATCH /api/v1/tasks/:id`
Actualiza parcialmente una tarea.

Body de ejemplo:

```json
{
  "done": true
}
```

O bien:

```json
{
  "title": "Nuevo título"
}
```

Respuesta correcta:
- `200 OK`

### `DELETE /api/v1/tasks/:id`
Elimina una tarea.

Respuesta correcta:
- `204 No Content`

## Errores que debes probar en Postman o Thunder Client

### Error 400
Enviar un `POST` sin título:

```json
{
  "category": "Trabajo",
  "priority": "Alta"
}
```

Respuesta esperada:

```json
{
  "error": "El título es obligatorio y debe tener al menos 3 caracteres."
}
```

### Error 404
Intentar borrar una tarea inexistente:

```text
DELETE /api/v1/tasks/id-inexistente
```

Respuesta esperada:

```json
{
  "error": "La tarea no existe."
}
```

### Error 500
Puedes provocarlo temporalmente lanzando un error manual dentro del servicio para comprobar que el middleware global responde con:

```json
{
  "error": "Error interno del servidor"
}
```

## Gestión de estados de red en el frontend

La interfaz ahora contempla tres estados reales:

- **Carga**: muestra un mensaje mientras el navegador espera la respuesta del backend.
- **Éxito**: renderiza la lista de tareas sincronizada con el servidor.
- **Error**: muestra un bloque visible si el backend responde con un 400, 404 o 500.

Esto es importante porque una aplicación conectada a red ya no puede asumir respuesta instantánea ni éxito permanente.

## Despliegue en Vercel

Se incluye un `vercel.json` como punto de partida para desplegar el backend. Antes de desplegar:

1. añade las variables de entorno en Vercel
2. revisa `CLIENT_ORIGIN`
3. comprueba que las rutas `/api/*` apunten al servidor Node

## Bonus y mejoras futuras

- Documentar la API con Swagger / OpenAPI
- Añadir pruebas automáticas
- Sustituir el array en memoria por una base de datos real
- Integrar Sentry para monitorización de errores
- Añadir autenticación y multiusuario
