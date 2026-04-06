# Pruebas de integración (Postman / Thunder Client)

Base URL:
- `http://localhost:3000`

## Flujo principal (happy path)

1. `GET /api/v1/tasks`
- Esperado: `200` + array JSON.

2. `POST /api/v1/tasks`
- Body:
```json
{
  "title": "Preparar práctica de Node",
  "category": "Estudio",
  "priority": "Alta",
  "dueDate": null
}
```
- Esperado: `201` + objeto con `id`, `createdAt`, `updatedAt`.

3. `PATCH /api/v1/tasks/:id`
- Body:
```json
{
  "done": true
}
```
- Esperado: `200` + tarea actualizada.

4. `DELETE /api/v1/tasks/:id`
- Esperado: `204` sin contenido.

## Errores intencionados

### Caso 400 (validación)

Request: `POST /api/v1/tasks`

Body inválido:
```json
{
  "title": "ab",
  "category": "Estudio",
  "priority": "Alta"
}
```

Esperado:
- `400`
- Mensaje: `El título es obligatorio y debe tener al menos 3 caracteres.`

### Caso 404 (NOT_FOUND)

Request: `DELETE /api/v1/tasks/id-inexistente`

Esperado:
- `404`
- Body:
```json
{
  "error": "La tarea no existe."
}
```

### Caso 500 (error interno controlado)

Request: `GET /api/v1/debug/error`

Nota: solo disponible si `NODE_ENV !== production`.

Esperado:
- `500`
- Body:
```json
{
  "error": "Error interno del servidor"
}
```

## Comprobación rápida con curl

```bash
# Health
curl -i http://localhost:3000/api/v1/health

# 400
curl -i -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"ab","category":"Estudio","priority":"Alta"}'

# 404
curl -i -X DELETE http://localhost:3000/api/v1/tasks/no-existe

# 500 (debug)
curl -i http://localhost:3000/api/v1/debug/error
```
