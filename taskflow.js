/* eslint-disable no-unused-vars */
"use strict";

/**
 * Bloque principal de JavaScript:
 * - Maneja tareas (crear, listar, buscar, completar, borrar)
 * - Guarda datos en localStorage
 * - Controla el tema claro/oscuro
 */

/**
 * Atajo para hacer querySelector con tipos básicos.
 * @param {string} selector - Selector CSS del elemento.
 * @returns {HTMLElement | null} Elemento encontrado o null.
 */
const selectElement = (selector) => document.querySelector(selector);

const rootElement = document.documentElement;

// Elementos de la interfaz
const themeToggleButton = selectElement("#themeBtn");
const themeIconElement = selectElement("#themeIcon");

const taskFormElement = selectElement("#taskForm");
const taskTitleInput = selectElement("#taskInput");
const taskCategorySelect = selectElement("#taskCategory");
const taskPrioritySelect = selectElement("#taskPriority");
const formErrorElement = (() => {
  const existing = selectElement("#formError");
  return existing;
})();

const taskListElement = selectElement("#taskList");
const emptyStateElement = selectElement("#emptyState");
const clearTasksButton = selectElement("#clearBtn");
const searchInputElement = selectElement("#searchInput");
const statusFilterSelect = selectElement("#statusFilter");
const categoryFilterSelect = selectElement("#categoryFilter");
const sortOrderSelect = selectElement("#sortOrder");
const demoTasksButton = selectElement("#demoTasksBtn");
const hideCompletedToggle = selectElement("#hideCompletedToggle");
const markAllDoneButton = selectElement("#markAllDoneBtn");
const resetFiltersButton = selectElement("#resetFiltersBtn");
const compactModeButton = selectElement("#compactModeBtn");
const statsSummaryElement = selectElement("#statsSummary");

// Claves de storage y listas permitidas
const TASKS_STORAGE_KEY = "taskflow_tasks";
const THEME_STORAGE_KEY = "taskflow_theme"; // "dark" | "light"
const STATUS_FILTER_STORAGE_KEY = "taskflow_status_filter"; // "all" | "pending" | "done"
const CATEGORY_FILTER_STORAGE_KEY = "taskflow_category_filter"; // "all" | categoría concreta
const SORT_ORDER_STORAGE_KEY = "taskflow_sort_order"; // ver valores en sortTasks
const HIDE_COMPLETED_STORAGE_KEY = "taskflow_hide_completed"; // "true" | "false"
const COMPACT_MODE_STORAGE_KEY = "taskflow_compact_mode"; // "true" | "false"
const ALLOWED_CATEGORIES = ["Estudio", "Trabajo", "Personal"];
const ALLOWED_PRIORITIES = ["Baja", "Media", "Alta"];

/** @type {Array<Task>} */
let tasks = loadTasks();

initializeTheme();
restoreStatusFilter();
restoreCategoryFilter();
restoreSortOrder();
restoreHideCompletedPreference();
restoreCompactModePreference();
renderTaskList();

// Eventos: registrar todos los manejadores de eventos de la app
themeToggleButton?.addEventListener("click", handleThemeToggle);
taskFormElement?.addEventListener("submit", handleTaskFormSubmit);
clearTasksButton?.addEventListener("click", handleClearTasksClick);
searchInputElement?.addEventListener("input", renderTaskList);
taskListElement?.addEventListener("click", handleTaskListClick);
statusFilterSelect?.addEventListener("change", handleStatusFilterChange);
categoryFilterSelect?.addEventListener("change", handleCategoryFilterChange);
sortOrderSelect?.addEventListener("change", handleSortOrderChange);
demoTasksButton?.addEventListener("click", handleDemoTasksClick);
hideCompletedToggle?.addEventListener("change", handleHideCompletedToggleChange);
markAllDoneButton?.addEventListener("click", handleMarkAllDoneClick);
resetFiltersButton?.addEventListener("click", handleResetFiltersClick);
compactModeButton?.addEventListener("click", handleCompactModeClick);

/**
 * Representa una tarea dentro de TaskFlow.
 * @typedef {Object} Task
 * @property {string} id - Identificador único de la tarea.
 * @property {string} title - Título de la tarea.
 * @property {string} category - Categoría de la tarea.
 * @property {string} priority - Prioridad de la tarea.
 * @property {boolean} done - Indica si la tarea está completada.
 * @property {number} createdAt - Marca de tiempo de creación (ms).
 */

/**
 * Maneja el envío del formulario de nueva tarea.
 * Valida los datos, crea la tarea y actualiza la lista.
 * @param {SubmitEvent} event - Evento de envío del formulario.
 * @returns {void}
 */
function handleTaskFormSubmit(event) {
  event.preventDefault();

  const rawTitle = taskTitleInput?.value?.trim() ?? "";
  const rawCategory = taskCategorySelect?.value ?? "";
  const rawPriority = taskPrioritySelect?.value ?? "";

  const validationError = validateTaskForm(rawTitle, rawCategory, rawPriority);

  if (validationError) {
    setFormError(validationError);
    return;
  }

  clearFormError();

  const safeCategory = normalizeCategory(rawCategory);
  const safePriority = normalizePriority(rawPriority);

  const newTask = createTask(rawTitle, safeCategory, safePriority);
  tasks = [newTask, ...tasks];

  persistTasksAndRender();

  if (taskFormElement) {
    taskFormElement.reset();
  }
  if (taskPrioritySelect) {
    taskPrioritySelect.value = "Media";
  }
  taskTitleInput?.focus();
}

/**
 * Valida los datos del formulario de nueva tarea.
 * @param {string} title - Título de la tarea.
 * @param {string} category - Categoría de la tarea.
 * @param {string} priority - Prioridad de la tarea.
 * @returns {string | null} Mensaje de error o null si es válido.
 */
function validateTaskForm(title, category, priority) {
  if (!title) {
    return "El título no puede estar vacío.";
  }
  if (title.length < 3) {
    return "El título debe tener al menos 3 caracteres.";
  }
  if (title.length > 120) {
    return "El título es demasiado largo (máx. 120 caracteres).";
  }

  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    return "La categoría seleccionada no es válida.";
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return "La prioridad seleccionada no es válida.";
  }

  return null;
}

/**
 * Crea un objeto de tarea listo para guardar.
 * @param {string} title - Título ya validado.
 * @param {string} category - Categoría normalizada.
 * @param {string} priority - Prioridad normalizada.
 * @returns {Task} Nueva tarea.
 */
function createTask(title, category, priority) {
  return {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: title.trim(),
    category,
    priority,
    done: false,
    createdAt: Date.now(),
  };
}

/**
 * Normaliza la categoría a un valor permitido.
 * Si no es válida, devuelve "Personal" como valor por defecto.
 * @param {string} category - Categoría original.
 * @returns {string} Categoría válida.
 */
function normalizeCategory(category) {
  if (ALLOWED_CATEGORIES.includes(category)) {
    return category;
  }
  return "Personal";
}

/**
 * Normaliza la prioridad a un valor permitido.
 * Si no es válida, devuelve "Media" como valor por defecto.
 * @param {string} priority - Prioridad original.
 * @returns {string} Prioridad válida.
 */
function normalizePriority(priority) {
  if (ALLOWED_PRIORITIES.includes(priority)) {
    return priority;
  }
  return "Media";
}

/**
 * Establece un mensaje de error visible para el formulario.
 * @param {string} message - Texto de error a mostrar.
 * @returns {void}
 */
function setFormError(message) {
  if (!formErrorElement) return;
  formErrorElement.textContent = message;
  formErrorElement.classList.remove("hidden");
}

/**
 * Limpia cualquier mensaje de error del formulario.
 * @returns {void}
 */
function clearFormError() {
  if (!formErrorElement) return;
  formErrorElement.textContent = "";
  formErrorElement.classList.add("hidden");
}

/**
 * Maneja el clic en el botón de limpiar todas las tareas.
 * @returns {void}
 */
function handleClearTasksClick() {
  tasks = [];
  persistTasksAndRender();
}

/**
 * Maneja los clics dentro de la lista de tareas (toggle / delete).
 * Usa delegation para un solo listener.
 * @param {MouseEvent} event - Evento de clic.
 * @returns {void}
 */
function handleTaskListClick(event) {
  /** @type {HTMLElement | null} */
  // @ts-ignore - closest existe en navegadores modernos
  const clickedButton = event.target.closest("[data-action]");
  if (!clickedButton) return;

  const listItem = clickedButton.closest("li");
  const taskId = listItem?.dataset?.id;
  if (!taskId) return;

  const action = clickedButton.dataset.action;

  if (action === "toggle") {
    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    );
    persistTasksAndRender();
  }

  if (action === "delete") {
    tasks = tasks.filter((task) => task.id !== taskId);
    persistTasksAndRender();
  }

  if (action === "edit") {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    if (!taskToEdit) return;

    const nextTitle = globalThis.prompt(
      "Nuevo título de la tarea:",
      taskToEdit.title
    );

    if (nextTitle == null) return;

    const trimmedTitle = nextTitle.trim();
    const validationError = validateTaskForm(
      trimmedTitle,
      taskToEdit.category,
      taskToEdit.priority
    );

    if (validationError) {
      globalThis.alert(validationError);
      return;
    }

    tasks = tasks.map((task) =>
      task.id === taskId ? { ...task, title: trimmedTitle } : task
    );
    persistTasksAndRender();
  }
}

/**
 * Maneja el cambio en el filtro de estado (todas / pendientes / completadas).
 * Persiste la preferencia y vuelve a renderizar la lista.
 * @returns {void}
 */
function handleStatusFilterChange() {
  if (!statusFilterSelect) return;
  try {
    globalThis.localStorage?.setItem(
      STATUS_FILTER_STORAGE_KEY,
      statusFilterSelect.value
    );
  } catch {
    // Ignorar errores de almacenamiento
  }
  renderTaskList();
}

/**
 * Maneja el cambio en el filtro de categoría.
 * Persiste la preferencia y vuelve a renderizar.
 * @returns {void}
 */
function handleCategoryFilterChange() {
  if (!categoryFilterSelect) return;
  try {
    globalThis.localStorage?.setItem(
      CATEGORY_FILTER_STORAGE_KEY,
      categoryFilterSelect.value
    );
  } catch {
    // Ignorar errores de almacenamiento
  }
  renderTaskList();
}

/**
 * Maneja el cambio en el orden de las tareas.
 * Persiste la preferencia y vuelve a renderizar.
 * @returns {void}
 */
function handleSortOrderChange() {
  if (!sortOrderSelect) return;
  try {
    globalThis.localStorage?.setItem(
      SORT_ORDER_STORAGE_KEY,
      sortOrderSelect.value
    );
  } catch {
    // Ignorar errores de almacenamiento
  }
  renderTaskList();
}


/**
 * Alterna el estado global de todas las tareas.
 * Si todas están hechas, las vuelve a pendiente.
 * Si hay alguna pendiente, marca todas como hechas.
 * @returns {void}
 */
function handleMarkAllDoneClick() {
  if (tasks.length === 0) return;

  const shouldMarkAllAsDone = tasks.some((task) => !task.done);

  tasks = tasks.map((task) => ({
    ...task,
    done: shouldMarkAllAsDone,
  }));

  persistTasksAndRender();
}

/**
 * Añade tareas de ejemplo sin duplicar las que ya existen por título.
 * @returns {void}
 */
function handleDemoTasksClick() {
  const demoTasks = [
    createTask("Preparar presentación de ShareTasks", "Trabajo", "Alta"),
    createTask("Repasar JavaScript del proyecto", "Estudio", "Media"),
    createTask("Comprar productos de limpieza del piso", "Personal", "Baja"),
    createTask("Organizar tareas de la semana con el grupo", "Trabajo", "Alta"),
  ];

  const existingTitles = new Set(
    tasks.map((task) => task.title.trim().toLowerCase())
  );

  const newDemoTasks = demoTasks.filter(
    (task) => !existingTitles.has(task.title.trim().toLowerCase())
  );

  if (newDemoTasks.length === 0) return;

  tasks = [...newDemoTasks, ...tasks];
  persistTasksAndRender();
}

/**
 * Maneja el cambio del interruptor para ocultar completadas.
 * @returns {void}
 */
function handleHideCompletedToggleChange() {
  if (!hideCompletedToggle) return;

  try {
    globalThis.localStorage?.setItem(
      HIDE_COMPLETED_STORAGE_KEY,
      String(hideCompletedToggle.checked)
    );
  } catch {
    // Ignorar errores de almacenamiento
  }

  renderTaskList();
}

/**
 * Restablece todos los filtros visuales a su valor por defecto.
 * @returns {void}
 */
function handleResetFiltersClick() {
  if (searchInputElement) searchInputElement.value = "";
  if (statusFilterSelect) statusFilterSelect.value = "all";
  if (categoryFilterSelect) categoryFilterSelect.value = "all";
  if (sortOrderSelect) sortOrderSelect.value = "created_desc";
  if (hideCompletedToggle) hideCompletedToggle.checked = false;

  try {
    globalThis.localStorage?.setItem(STATUS_FILTER_STORAGE_KEY, "all");
    globalThis.localStorage?.setItem(CATEGORY_FILTER_STORAGE_KEY, "all");
    globalThis.localStorage?.setItem(SORT_ORDER_STORAGE_KEY, "created_desc");
    globalThis.localStorage?.setItem(HIDE_COMPLETED_STORAGE_KEY, "false");
  } catch {
    // Ignorar errores de almacenamiento
  }

  renderTaskList();
}

/**
 * Activa o desactiva el modo compacto de la lista.
 * @returns {void}
 */
function handleCompactModeClick() {
  const compactModeEnabled = !rootElement.classList.contains("compact-mode");
  applyCompactMode(compactModeEnabled, true);
  renderTaskList();
}

/**
 * Guarda el array de tareas actual en localStorage
 * y vuelve a renderizar la lista.
 * @returns {void}
 */
function persistTasksAndRender() {
  saveTasks();
  renderTaskList();
}

/**
 * Vuelve a dibujar la lista de tareas en pantalla
 * aplicando el filtro de búsqueda actual.
 * @returns {void}
 */
function renderTaskList() {
  if (!taskListElement || !emptyStateElement) return;

  const query = searchInputElement?.value?.trim().toLowerCase() ?? "";
  const statusFilter = statusFilterSelect?.value ?? "all";
  const categoryFilter = categoryFilterSelect?.value ?? "all";
  const hideCompleted = hideCompletedToggle?.checked ?? false;
  const filteredTasks = getFilteredTasks(
    tasks,
    query,
    statusFilter,
    categoryFilter,
    hideCompleted
  );

  const sortOrder = sortOrderSelect?.value ?? "created_desc";
  const sortedTasks = sortTasks(filteredTasks, sortOrder);

  taskListElement.innerHTML = sortedTasks.map(taskItemTemplate).join("");
  emptyStateElement.classList.toggle("hidden", sortedTasks.length !== 0);
  emptyStateElement.textContent = getEmptyStateMessage(
    tasks,
    query,
    statusFilter,
    categoryFilter,
    hideCompleted
  );
  syncBulkActionButtons();
  updateStatsSummary();
}

/**
 * Devuelve la lista de tareas filtrada por texto.
 * @param {Task[]} taskList - Lista completa de tareas.
 * @param {string} query - Texto de búsqueda en minúsculas.
 * @param {string} statusFilter - Filtro de estado ("all" | "pending" | "done").
 * @param {string} categoryFilter - Filtro de categoría ("all" | nombre de categoría).
 * @returns {Task[]} Tareas que coinciden con el filtro.
 */
function getFilteredTasks(taskList, query, statusFilter, categoryFilter, hideCompleted = false) {
  let result = taskList;

  // Filtro por texto
  if (query) {
    result = result.filter((task) => {
      const titleMatch = task.title.toLowerCase().includes(query);
      const categoryMatch = task.category.toLowerCase().includes(query);
      const priorityMatch = task.priority.toLowerCase().includes(query);
      return titleMatch || categoryMatch || priorityMatch;
    });
  }

  // Filtro por estado
  if (statusFilter === "pending") {
    result = result.filter((task) => !task.done);
  } else if (statusFilter === "done") {
    result = result.filter((task) => task.done);
  }

  // Filtro por categoría
  if (categoryFilter !== "all") {
    result = result.filter((task) => task.category === categoryFilter);
  }

  // Ocultar tareas completadas
  if (hideCompleted) {
    result = result.filter((task) => !task.done);
  }

  return result;
}

/**
 * Ordena una lista de tareas según el criterio indicado.
 * @param {Task[]} taskList - Lista de tareas filtradas.
 * @param {string} sortOrder - Criterio de orden (created_desc, created_asc, priority_desc, title_asc, title_desc).
 * @returns {Task[]} Nueva lista ordenada.
 */
function sortTasks(taskList, sortOrder) {
  const tasksCopy = [...taskList];

  if (sortOrder === "created_asc") {
    return tasksCopy.sort((a, b) => a.createdAt - b.createdAt);
  }

  if (sortOrder === "priority_desc") {
    const priorityRank = { Alta: 3, Media: 2, Baja: 1 };
    return tasksCopy.sort(
      (a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
    );
  }

  if (sortOrder === "title_asc") {
    return tasksCopy.sort((a, b) =>
      a.title.localeCompare(b.title, "es", { sensitivity: "base" })
    );
  }

  if (sortOrder === "title_desc") {
    return tasksCopy.sort((a, b) =>
      b.title.localeCompare(a.title, "es", { sensitivity: "base" })
    );
  }

  // created_desc por defecto
  return tasksCopy.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Genera el HTML de una sola tarea.
 * @param {Task} task - Tarea a representar.
 * @returns {string} HTML de la tarjeta de tarea.
 */
function taskItemTemplate(task) {
  const compactModeEnabled = rootElement.classList.contains("compact-mode");
  const titleClass = task.done
    ? "text-slate-400 line-through dark:text-slate-500"
    : "text-slate-900 dark:text-slate-100";
  const itemClass = compactModeEnabled
    ? "group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition duration-200 hover:shadow dark:border-slate-800 dark:bg-slate-950/30"
    : "group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow dark:border-slate-800 dark:bg-slate-950/30";
  const toggleButtonClass = compactModeEnabled
    ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600"
    : "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600";
  const actionButtonClass = compactModeEnabled
    ? "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm transition duration-200 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600 sm:opacity-0 sm:group-hover:opacity-100"
    : "inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600 sm:opacity-0 sm:group-hover:opacity-100";
  const metaSpacingClass = compactModeEnabled
    ? "mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]"
    : "mt-2 flex flex-wrap items-center gap-2 text-xs";
  const titleSizeClass = compactModeEnabled ? "truncate text-xs font-medium" : "truncate text-sm font-medium";

  return `
    <li data-id="${task.id}" class="${itemClass}">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <button
            data-action="toggle"
            class="${toggleButtonClass}"
            title="Hecha / Pendiente"
            aria-label="Hecha / Pendiente"
          >
            ${task.done ? "✅" : "⬜"}
          </button>

          <p class="${titleSizeClass} ${titleClass}">
            ${escapeHTML(task.title)}
          </p>
        </div>

        <div class="${metaSpacingClass}">
          ${badgeLabel(task.category)}
          ${badgePriority(task.priority)}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          data-action="edit"
          class="${actionButtonClass}"
          title="Editar"
          aria-label="Editar"
        >
          ✏️ <span class="hidden sm:inline">Editar</span>
        </button>
        <button
          data-action="delete"
          class="${actionButtonClass}"
          title="Eliminar"
          aria-label="Eliminar"
        >
          🗑 <span class="hidden sm:inline">Borrar</span>
        </button>
      </div>
    </li>
  `;
}

/**
 * Badge base reutilizable para categoría / texto simple.
 * @param {string} text - Texto a mostrar.
 * @returns {string} HTML del badge.
 */
function badgeLabel(text) {
  return `
    <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      ${escapeHTML(text)}
    </span>
  `;
}

/**
 * Badge que cambia según la prioridad (Alta, Media, Baja).
 * @param {string} priority - Prioridad de la tarea.
 * @returns {string} HTML del badge de prioridad.
 */
function badgePriority(priority) {
  if (priority === "Alta") {
    return `
      <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100">
        🔥 ${priority}
      </span>
    `;
  }
  if (priority === "Media") {
    return `
      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
        ⚡ ${priority}
      </span>
    `;
  }
  return `
    <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
      🌿 ${priority}
    </span>
  `;
}

/**
 * Guarda las tareas actuales en localStorage.
 * @returns {void}
 */
function saveTasks() {
  try {
    globalThis.localStorage?.setItem(
      TASKS_STORAGE_KEY,
      JSON.stringify(tasks)
    );
  } catch {
    // Si localStorage falla (modo incógnito extremo, etc), se ignora el error.
  }
}

/**
 * Carga las tareas desde localStorage.
 * Devuelve un array vacío en caso de error o ausencia de datos.
 * @returns {Task[]} Lista de tareas.
 */
function loadTasks() {
  try {
    const raw = globalThis.localStorage?.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Inicializa el tema claro/oscuro leyendo la preferencia guardada.
 * @returns {void}
 */
function initializeTheme() {
  try {
    const savedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark") {
      rootElement.classList.add("dark");
    } else if (savedTheme === "light") {
      rootElement.classList.remove("dark");
    }
  } catch {
    // Si no hay acceso a localStorage, simplemente usamos el valor por defecto.
  }

  syncThemeIcon();
}

/**
 * Restaura el filtro de estado desde localStorage si existe.
 * @returns {void}
 */
function restoreStatusFilter() {
  if (!statusFilterSelect) return;
  try {
    const saved = globalThis.localStorage?.getItem(STATUS_FILTER_STORAGE_KEY);
    if (saved === "all" || saved === "pending" || saved === "done") {
      statusFilterSelect.value = saved;
    }
  } catch {
    // Silenciar errores de lectura
  }
}

/**
 * Restaura el filtro de categoría desde localStorage si existe.
 * @returns {void}
 */
function restoreCategoryFilter() {
  if (!categoryFilterSelect) return;
  try {
    const saved = globalThis.localStorage?.getItem(
      CATEGORY_FILTER_STORAGE_KEY
    );
    if (!saved) return;
    if (saved === "all" || ALLOWED_CATEGORIES.includes(saved)) {
      categoryFilterSelect.value = saved;
    }
  } catch {
    // Silenciar errores de lectura
  }
}

/**
 * Restaura el criterio de orden desde localStorage si existe.
 * @returns {void}
 */
function restoreSortOrder() {
  if (!sortOrderSelect) return;
  try {
    const saved = globalThis.localStorage?.getItem(SORT_ORDER_STORAGE_KEY);
    if (!saved) return;
    const allowed = [
      "created_desc",
      "created_asc",
      "priority_desc",
      "title_asc",
      "title_desc",
    ];
    if (allowed.includes(saved)) {
      sortOrderSelect.value = saved;
    }
  } catch {
    // Silenciar errores de lectura
  }
}


/**
 * Restaura la preferencia de ocultar tareas completadas.
 * @returns {void}
 */
function restoreHideCompletedPreference() {
  if (!hideCompletedToggle) return;

  try {
    const saved = globalThis.localStorage?.getItem(HIDE_COMPLETED_STORAGE_KEY);
    hideCompletedToggle.checked = saved === "true";
  } catch {
    hideCompletedToggle.checked = false;
  }
}

/**
 * Restaura la preferencia del modo compacto desde localStorage.
 * @returns {void}
 */
function restoreCompactModePreference() {
  try {
    const saved = globalThis.localStorage?.getItem(COMPACT_MODE_STORAGE_KEY);
    applyCompactMode(saved === "true", false);
  } catch {
    applyCompactMode(false, false);
  }
}

/**
 * Aplica visualmente el modo compacto.
 * @param {boolean} enabled - Si el modo compacto está activo.
 * @param {boolean} persist - Si también debe guardarse en localStorage.
 * @returns {void}
 */
function applyCompactMode(enabled, persist = false) {
  rootElement.classList.toggle("compact-mode", enabled);

  if (taskListElement) {
    taskListElement.className = enabled ? "space-y-1" : "space-y-2";
  }

  if (persist) {
    try {
      globalThis.localStorage?.setItem(COMPACT_MODE_STORAGE_KEY, String(enabled));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }

  syncBulkActionButtons();
}

/**
 * Devuelve el mensaje del estado vacío según el filtro activo.
 * @param {Task[]} taskList - Lista completa de tareas.
 * @param {string} query - Texto buscado.
 * @param {string} statusFilter - Estado seleccionado.
 * @param {string} categoryFilter - Categoría seleccionada.
 * @param {boolean} hideCompleted - Si se ocultan completadas.
 * @returns {string} Mensaje a mostrar.
 */
function getEmptyStateMessage(taskList, query, statusFilter, categoryFilter, hideCompleted) {
  if (taskList.length === 0) {
    return "No hay tareas todavía.";
  }

  if (query) {
    return "No hay tareas que coincidan con la búsqueda.";
  }

  if (hideCompleted) {
    return "No hay tareas pendientes visibles porque las completadas están ocultas.";
  }

  if (statusFilter === "pending") {
    return "No hay tareas pendientes.";
  }

  if (statusFilter === "done") {
    return "No hay tareas completadas.";
  }

  if (categoryFilter !== "all") {
    return "No hay tareas en esa categoría.";
  }

  return "No hay tareas para mostrar.";
}

/**
 * Sincroniza el texto de los botones globales según el estado actual.
 * @returns {void}
 */
function syncBulkActionButtons() {
  if (markAllDoneButton) {
    const allTasksDone = tasks.length > 0 && tasks.every((task) => task.done);
    markAllDoneButton.textContent = allTasksDone
      ? "↩️ Desmarcar todas"
      : "✅ Marcar todas hechas";
    markAllDoneButton.disabled = tasks.length === 0;
    markAllDoneButton.classList.toggle("opacity-50", tasks.length === 0);
    markAllDoneButton.classList.toggle("cursor-not-allowed", tasks.length === 0);
  }

  if (compactModeButton) {
    const compactModeEnabled = rootElement.classList.contains("compact-mode");
    compactModeButton.textContent = compactModeEnabled
      ? "📐 Vista normal"
      : "📐 Compacto";
  }
}

/**
 * Actualiza el pequeño resumen inferior con estadísticas de las tareas.
 * @returns {void}
 */
function updateStatsSummary() {
  if (!statsSummaryElement) return;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  const pendingTasks = totalTasks - completedTasks;

  if (totalTasks === 0) {
    statsSummaryElement.textContent = "0 tareas en total.";
    return;
  }

  statsSummaryElement.textContent = `${totalTasks} tareas · ${pendingTasks} pendientes · ${completedTasks} completadas`;
}

/**
 * Maneja el clic del botón de tema para alternar claro/oscuro.
 * @returns {void}
 */
function handleThemeToggle() {
  rootElement.classList.toggle("dark");
  try {
    const mode = rootElement.classList.contains("dark") ? "dark" : "light";
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignorar errores de almacenamiento
  }
  syncThemeIcon();
}

/**
 * Sincroniza el icono del botón de tema con el modo actual.
 * @returns {void}
 */
function syncThemeIcon() {
  if (!themeIconElement) return;
  themeIconElement.textContent = rootElement.classList.contains("dark")
    ? "🌙"
    : "☀️";
}

/**
 * Escapa caracteres especiales de HTML para evitar inyecciones XSS.
 * @param {string} value - Texto a escapar.
 * @returns {string} Texto seguro para inyectar en HTML.
 */
function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (match) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[match] || match;
  });
}

