# Backend API y herramientas profesionales

## Axios
Axios es una librería de cliente HTTP para JavaScript. Se usa para enviar peticiones `GET`, `POST`, `PATCH` o `DELETE` a una API con una sintaxis muy cómoda. En TaskFlow se puede usar como alternativa a `fetch` porque facilita:

- interceptores de peticiones y respuestas
- timeout configurable
- transformación automática de JSON
- mejor manejo de errores HTTP

Ejemplo:

```js
const response = await axios.get('http://localhost:3000/api/v1/tasks');
console.log(response.data);
```

## Postman
Postman es una herramienta para probar APIs sin depender del frontend. Se usa para:

- comprobar que los endpoints responden correctamente
- enviar cuerpos JSON manuales
- forzar errores 400, 404 y 500
- guardar colecciones de pruebas

Ejemplos para TaskFlow:

- `GET /api/v1/tasks`
- `POST /api/v1/tasks` con un body válido
- `POST /api/v1/tasks` sin `title` para forzar un 400
- `DELETE /api/v1/tasks/123` para forzar un 404 si no existe

## Sentry
Sentry es una plataforma de monitorización de errores. Se usa para capturar excepciones en frontend y backend, registrar trazas y detectar fallos en producción.

En TaskFlow sería útil para:

- registrar errores no controlados del servidor
- ver qué endpoint falla con más frecuencia
- capturar errores JavaScript del navegador
- recibir alertas cuando la aplicación cae

## Swagger
Swagger, normalmente mediante OpenAPI, se usa para documentar APIs REST de forma profesional. Permite definir:

- endpoints disponibles
- parámetros de entrada
- esquemas JSON
- códigos HTTP de respuesta

Ventajas:

- documentación viva de la API
- pruebas desde navegador
- contrato claro entre frontend y backend
- escalabilidad del proyecto

## Por qué se usan estas herramientas
Estas herramientas ayudan a profesionalizar el desarrollo:

- **Axios**: mejora la capa cliente
- **Postman**: valida el backend de forma aislada
- **Sentry**: observa errores reales en producción
- **Swagger**: documenta el contrato HTTP de la API

En un proyecto académico como TaskFlow, conocerlas demuestra que no solo sabes programar, sino también diseñar, probar, documentar y mantener software.
