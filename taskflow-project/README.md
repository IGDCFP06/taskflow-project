# TaskFlow

TaskFlow es una pequeña aplicación web para gestionar tareas (to‑dos) en el navegador, sin backend, pensada como ejemplo de buenas prácticas con JavaScript sencillo, Tailwind CSS y uso ligero de IA para refactorizar y documentar el código.

## Características principales

- **Gestión básica de tareas**: crear, marcar como completadas y eliminar tareas.
- **Validaciones de formulario**:
  - Título obligatorio.
  - Longitud mínima y máxima (3–120 caracteres).
  - Categoría y prioridad limitadas a valores válidos.
- **Filtros avanzados**:
  - **Búsqueda por texto** (título, categoría, prioridad).
  - **Filtro por estado**: todas, pendientes o completadas.
  - **Filtro por categoría**: Estudio, Trabajo, Personal.
- **Ordenación configurable**:
  - Más recientes / más antiguas.
  - Prioridad alta primero.
  - Título A–Z / Z–A.
- **Edición rápida de tareas**:
  - Botón “Editar” para cambiar el título de una tarea ya creada.
- **Persistencia en `localStorage`**:
  - Tareas y preferencias de filtros/orden se guardan entre recargas.
- **Tema claro/oscuro**:
  - Toggle de tema con persistencia.

## Estructura del proyecto

- `index.html`: página principal de TaskFlow.
  - Layout de la interfaz (header, formulario de nueva tarea, lista, filtros).
  - Carga Tailwind CSS desde CDN.
  - Incluye un `<script>` pequeño solo para configurar Tailwind y otro para cargar `taskflow.js`.

- `taskflow.js`: lógica de la aplicación.
  - Manejo del formulario, validaciones y creación de tareas.
  - Renderizado, filtrado y ordenación de la lista.
  - Edición y borrado de tareas.
  - Gestión de tema (claro/oscuro).
  - Persistencia en `localStorage` de tareas y preferencias de usuario.

- `docs/ai/*`: documentación relacionada con el uso de IA y flujos de trabajo en este proyecto.

## Cómo usar el proyecto

### Requisitos

- Solo necesitas un **navegador moderno** (no hace falta servidor ni build).

### Puesta en marcha

1. Clona o descarga este repositorio.
2. Abre el archivo `index.html` directamente en tu navegador (doble clic o “Open with Browser”).
3. Empieza a crear tareas desde el panel izquierdo.

### Flujo básico

1. Escribe un título de tarea, elige **categoría** y **prioridad** y pulsa **“+ Añadir tarea”**.
2. Usa el icono de cuadro/✅ para marcar tareas como pendientes o completadas.
3. Usa el botón 🗑 para borrar una tarea.
4. Usa el botón ✏️ para editar el título de una tarea existente.
5. Utiliza el buscador y los filtros para encontrar tareas rápidamente.

## Ejemplos de uso

### Ejemplo 1: Lista de estudio

1. Crea tareas como:
   - “Estudiar Tailwind”
   - “Practicar JavaScript”
   - “Leer documentación de IA”
2. Marca la categoría como **Estudio** y ajusta la **Prioridad** a Alta/Media.
3. Filtra por categoría “Estudio” y ordena por “Prioridad alta primero” para ver primero lo más importante.

### Ejemplo 2: Mezcla de trabajo y personal

1. Añade tareas con distintas categorías:
   - “Preparar informe semanal” → Categoría: **Trabajo**, Prioridad: Alta.
   - “Ir al gimnasio” → Categoría: **Personal**, Prioridad: Media.
2. Usa el filtro de **estado** para ver solo tareas pendientes.
3. Usa el filtro de **categoría** para centrarte en “Trabajo” durante tu jornada laboral.

### Ejemplo 3: Limpieza rápida de tareas

1. Cuando termines un bloque de trabajo, pulsa el botón 🧹 “Limpiar” para borrar todas las tareas.
2. Empieza una nueva sesión de tareas sin restos antiguos.

## Documentación de funciones clave

La lógica principal está en `taskflow.js`. A continuación se resumen algunas funciones importantes (además de la documentación JSDoc presente en el propio archivo):

- **`handleTaskFormSubmit(event)`**  
  Maneja el envío del formulario de nueva tarea.  
  - Valida los datos mediante `validateTaskForm`.  
  - Normaliza categoría y prioridad (`normalizeCategory`, `normalizePriority`).  
  - Crea una nueva tarea (`createTask`) y la añade al principio de la lista.  
  - Guarda en `localStorage` y vuelve a renderizar (`persistTasksAndRender`).

- **`validateTaskForm(title, category, priority)`**  
  Verifica que:
  - El título no esté vacío y cumpla los límites de longitud.
  - La categoría y prioridad estén dentro de las listas permitidas.
  Devuelve `null` si todo está bien o un mensaje de error en español si hay problemas.

- **`renderTaskList()`**  
  Orquesta el refresco de la lista:
  - Lee el texto de búsqueda, el filtro de estado, el filtro de categoría y el criterio de orden.
  - Llama a `getFilteredTasks` y después a `sortTasks`.
  - Genera el HTML de cada tarea con `taskItemTemplate` y lo inyecta en el DOM.
  - Muestra u oculta el estado vacío según corresponda.

- **`getFilteredTasks(taskList, query, statusFilter, categoryFilter)`**  
  Recibe la lista completa de tareas y devuelve una lista filtrada:
  - Por texto (en título, categoría o prioridad).
  - Por estado (todas, pendientes, completadas).
  - Por categoría específica (o todas).

- **`sortTasks(taskList, sortOrder)`**  
  Ordena las tareas según:
  - Fecha de creación (ascendente/descendente).
  - Prioridad (Alta > Media > Baja).
  - Título (A–Z o Z–A).

- **`handleTaskListClick(event)`**  
  Listener de eventos delegados para la lista de tareas:
  - **`toggle`**: marca una tarea como hecha/pendiente.
  - **`delete`**: elimina la tarea.
  - **`edit`**: abre un `prompt` para editar el título y reutiliza `validateTaskForm` para validar el nuevo valor.

- **`initializeTheme()`, `handleThemeToggle()`, `syncThemeIcon()`**  
  Controlan el tema claro/oscuro:
  - Leen y guardan la preferencia en `localStorage`.
  - Aplican la clase `dark` al `documentElement`.
  - Ajustan el icono del botón de tema.

## Notas sobre el uso de IA

Parte de este proyecto se ha refactorizado y documentado con ayuda de una IA:

- Se han propuesto nombres de funciones y variables más expresivos.
- Se ha separado la lógica en funciones pequeñas y reutilizables.
- Se ha añadido documentación JSDoc en las funciones clave.
- Se han generado ideas de nuevas funcionalidades (filtros, ordenación, edición) y después se han revisado y corregido manualmente.

Si amplías el proyecto, se recomienda mantener este estilo:

- Funciones pequeñas, con un propósito claro.
- Nombres descriptivos (en español o en inglés, pero consistentes).
- Comentarios JSDoc cuando el comportamiento no es completamente evidente.
- Commits pequeños y bien descritos al añadir nuevas funcionalidades.

