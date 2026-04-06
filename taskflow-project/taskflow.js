"use strict";

const selectElement = (selector) => document.querySelector(selector);

const rootElement = document.documentElement;

const themeToggleButton = selectElement("#themeBtn");
const themeIconElement = selectElement("#themeIcon");

const taskFormElement = selectElement("#taskForm");
const taskTitleInput = selectElement("#taskInput");
const taskCategorySelect = selectElement("#taskCategory");
const taskPrioritySelect = selectElement("#taskPriority");
const taskDueDateInput = selectElement("#taskDueDate");
const formErrorElement = selectElement("#formError");

const taskListElement = selectElement("#taskList");
const emptyStateElement = selectElement("#emptyState");
const networkStateElement = selectElement("#networkState");
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

const THEME_STORAGE_KEY = "taskflow_theme";
const STATUS_FILTER_STORAGE_KEY = "taskflow_status_filter";
const CATEGORY_FILTER_STORAGE_KEY = "taskflow_category_filter";
const SORT_ORDER_STORAGE_KEY = "taskflow_sort_order";
const HIDE_COMPLETED_STORAGE_KEY = "taskflow_hide_completed";
const COMPACT_MODE_STORAGE_KEY = "taskflow_compact_mode";

const ALLOWED_CATEGORIES = ["Estudio", "Trabajo", "Personal"];
const ALLOWED_PRIORITIES = ["Baja", "Media", "Alta"];

const apiClient = globalThis.TaskflowApi;

/** @type {Array<Task>} */
let tasks = [];
let requestCounter = 0;

initializeTheme();
restoreStatusFilter();
restoreCategoryFilter();
restoreSortOrder();
restoreHideCompletedPreference();
restoreCompactModePreference();
syncBulkActionButtons();
renderTaskList();

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

bootstrap();

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string} priority
 * @property {boolean} done
 * @property {string | null} dueDate
 * @property {number} createdAt
 * @property {number} updatedAt
 */

async function bootstrap() {
  if (!isApiReady()) {
    setNetworkState(
      "error",
      "No se pudo inicializar el cliente API. Revisa que src/api/client.js se esté cargando."
    );
    return;
  }

  await refreshTasks("Cargando tareas desde el servidor...");
}

function isApiReady() {
  return Boolean(
    apiClient &&
      typeof apiClient.getTasksRequest === "function" &&
      typeof apiClient.createTaskRequest === "function" &&
      typeof apiClient.updateTaskRequest === "function" &&
      typeof apiClient.deleteTaskRequest === "function"
  );
}

function setNetworkState(type, message = "") {
  if (!networkStateElement) return;

  networkStateElement.classList.remove(
    "hidden",
    "border-amber-200",
    "bg-amber-50",
    "text-amber-700",
    "dark:border-amber-900",
    "dark:bg-amber-950/40",
    "dark:text-amber-200",
    "border-emerald-200",
    "bg-emerald-50",
    "text-emerald-700",
    "dark:border-emerald-900",
    "dark:bg-emerald-950/40",
    "dark:text-emerald-200",
    "border-red-200",
    "bg-red-50",
    "text-red-700",
    "dark:border-red-900",
    "dark:bg-red-950/40",
    "dark:text-red-200"
  );

  if (!message || type === "idle") {
    networkStateElement.textContent = "";
    networkStateElement.classList.add("hidden");
    return;
  }

  networkStateElement.textContent = message;

  if (type === "loading") {
    networkStateElement.classList.add(
      "border-amber-200",
      "bg-amber-50",
      "text-amber-700",
      "dark:border-amber-900",
      "dark:bg-amber-950/40",
      "dark:text-amber-200"
    );
    return;
  }

  if (type === "success") {
    networkStateElement.classList.add(
      "border-emerald-200",
      "bg-emerald-50",
      "text-emerald-700",
      "dark:border-emerald-900",
      "dark:bg-emerald-950/40",
      "dark:text-emerald-200"
    );
    return;
  }

  networkStateElement.classList.add(
    "border-red-200",
    "bg-red-50",
    "text-red-700",
    "dark:border-red-900",
    "dark:bg-red-950/40",
    "dark:text-red-200"
  );
}

function beginRequest(loadingMessage) {
  requestCounter += 1;
  if (loadingMessage) {
    setNetworkState("loading", loadingMessage);
  }
}

function endRequest() {
  requestCounter = Math.max(0, requestCounter - 1);
}

function hasActiveRequests() {
  return requestCounter > 0;
}

function getHttpErrorMessage(error) {
  if (error?.status === 400) return error.message || "Datos inválidos (400).";
  if (error?.status === 404) return error.message || "Recurso no encontrado (404).";
  if (error?.status === 500) return "El servidor devolvió un error interno (500).";
  if (error?.code === "NETWORK_ERROR") return "No se pudo conectar con el backend.";
  return error?.message || "Error inesperado al comunicarse con la API.";
}

async function refreshTasks(loadingMessage = "Sincronizando con servidor...") {
  beginRequest(loadingMessage);
  let completed = false;

  try {
    const response = await apiClient.getTasksRequest();
    tasks = Array.isArray(response) ? response : [];
    renderTaskList();
    completed = true;
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
    renderTaskList();
  } finally {
    endRequest();
    if (completed && !hasActiveRequests()) {
      setNetworkState("success", "Tareas sincronizadas correctamente.");
    }
  }
}

async function handleTaskFormSubmit(event) {
  event.preventDefault();

  const rawTitle = taskTitleInput?.value?.trim() ?? "";
  const rawCategory = taskCategorySelect?.value ?? "";
  const rawPriority = taskPrioritySelect?.value ?? "";
  const rawDueDate = taskDueDateInput?.value || null;

  const validationError = validateTaskForm(rawTitle, rawCategory, rawPriority);
  if (validationError) {
    setFormError(validationError);
    return;
  }

  clearFormError();

  beginRequest("Creando tarea...");

  try {
    const createdTask = await apiClient.createTaskRequest({
      title: rawTitle,
      category: normalizeCategory(rawCategory),
      priority: normalizePriority(rawPriority),
      dueDate: rawDueDate || null,
    });

    if (createdTask) {
      tasks = [createdTask, ...tasks];
      renderTaskList();
    }

    if (taskFormElement) taskFormElement.reset();
    if (taskPrioritySelect) taskPrioritySelect.value = "Media";
    taskTitleInput?.focus();

    setNetworkState("success", "Tarea creada correctamente.");
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
  } finally {
    endRequest();
  }
}

function validateTaskForm(title, category, priority) {
  if (!title) return "El título no puede estar vacío.";
  if (title.length < 3) return "El título debe tener al menos 3 caracteres.";
  if (title.length > 120) return "El título es demasiado largo (máx. 120 caracteres).";

  if (category && !ALLOWED_CATEGORIES.includes(category)) {
    return "La categoría seleccionada no es válida.";
  }

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    return "La prioridad seleccionada no es válida.";
  }

  return null;
}

function normalizeCategory(category) {
  return ALLOWED_CATEGORIES.includes(category) ? category : "Personal";
}

function normalizePriority(priority) {
  return ALLOWED_PRIORITIES.includes(priority) ? priority : "Media";
}

function setFormError(message) {
  if (!formErrorElement) return;
  formErrorElement.textContent = message;
  formErrorElement.classList.remove("hidden");
}

function clearFormError() {
  if (!formErrorElement) return;
  formErrorElement.textContent = "";
  formErrorElement.classList.add("hidden");
}

async function handleClearTasksClick() {
  if (tasks.length === 0) {
    setNetworkState("success", "No hay tareas para eliminar.");
    return;
  }

  beginRequest("Eliminando todas las tareas...");

  try {
    await Promise.all(tasks.map((task) => apiClient.deleteTaskRequest(task.id)));
    tasks = [];
    renderTaskList();
    setNetworkState("success", "Todas las tareas han sido eliminadas.");
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
    await refreshTasks("Reconstruyendo estado tras error...");
  } finally {
    endRequest();
  }
}

async function handleTaskListClick(event) {
  const clickedButton = event.target.closest("[data-action]");
  if (!clickedButton) return;

  const listItem = clickedButton.closest("li");
  const taskId = listItem?.dataset?.id;
  if (!taskId) return;

  const action = clickedButton.dataset.action;

  if (action === "toggle") {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    await updateTask(taskId, { done: !task.done }, "Tarea actualizada.");
    return;
  }

  if (action === "delete") {
    await deleteTask(taskId);
    return;
  }

  if (action === "edit") {
    const taskToEdit = tasks.find((item) => item.id === taskId);
    if (!taskToEdit) return;

    const nextTitle = globalThis.prompt("Nuevo título de la tarea:", taskToEdit.title);
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

    await updateTask(taskId, { title: trimmedTitle }, "Título actualizado.");
  }
}

async function updateTask(taskId, updates, successMessage) {
  beginRequest("Guardando cambios...");

  try {
    const updatedTask = await apiClient.updateTaskRequest(taskId, updates);
    tasks = tasks.map((task) => (task.id === taskId ? updatedTask : task));
    renderTaskList();
    setNetworkState("success", successMessage || "Cambios guardados.");
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
  } finally {
    endRequest();
  }
}

async function deleteTask(taskId) {
  beginRequest("Eliminando tarea...");

  try {
    await apiClient.deleteTaskRequest(taskId);
    tasks = tasks.filter((task) => task.id !== taskId);
    renderTaskList();
    setNetworkState("success", "Tarea eliminada.");
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
  } finally {
    endRequest();
  }
}

function handleStatusFilterChange() {
  if (!statusFilterSelect) return;

  try {
    globalThis.localStorage?.setItem(STATUS_FILTER_STORAGE_KEY, statusFilterSelect.value);
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  renderTaskList();
}

function handleCategoryFilterChange() {
  if (!categoryFilterSelect) return;

  try {
    globalThis.localStorage?.setItem(CATEGORY_FILTER_STORAGE_KEY, categoryFilterSelect.value);
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  renderTaskList();
}

function handleSortOrderChange() {
  if (!sortOrderSelect) return;

  try {
    globalThis.localStorage?.setItem(SORT_ORDER_STORAGE_KEY, sortOrderSelect.value);
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  renderTaskList();
}

async function handleMarkAllDoneClick() {
  if (tasks.length === 0) {
    setNetworkState("success", "No hay tareas para actualizar.");
    return;
  }

  const allTasksDone = tasks.every((task) => task.done);
  const nextDoneValue = !allTasksDone;

  beginRequest("Actualizando estado global de tareas...");

  try {
    const updatedTasks = await Promise.all(
      tasks.map((task) => apiClient.updateTaskRequest(task.id, { done: nextDoneValue }))
    );

    tasks = updatedTasks;
    renderTaskList();

    setNetworkState(
      "success",
      nextDoneValue
        ? "Todas las tareas quedaron completadas."
        : "Todas las tareas volvieron a pendientes."
    );
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
    await refreshTasks("Reconstruyendo estado tras error...");
  } finally {
    endRequest();
  }
}

async function handleDemoTasksClick() {
  const demoTasks = [
    {
      title: "Repasar arquitectura por capas",
      category: "Estudio",
      priority: "Alta",
      dueDate: null,
    },
    {
      title: "Preparar pruebas en Postman",
      category: "Trabajo",
      priority: "Media",
      dueDate: null,
    },
    {
      title: "Actualizar README técnico",
      category: "Personal",
      priority: "Baja",
      dueDate: null,
    },
  ];

  beginRequest("Creando tareas de ejemplo...");

  try {
    const createdTasks = await Promise.all(
      demoTasks.map((task) => apiClient.createTaskRequest(task))
    );

    tasks = [...createdTasks, ...tasks];
    renderTaskList();
    setNetworkState("success", "Tareas de ejemplo creadas.");
  } catch (error) {
    setNetworkState("error", getHttpErrorMessage(error));
    await refreshTasks("Reconstruyendo estado tras error...");
  } finally {
    endRequest();
  }
}

function handleHideCompletedToggleChange() {
  if (!hideCompletedToggle) return;

  try {
    globalThis.localStorage?.setItem(
      HIDE_COMPLETED_STORAGE_KEY,
      String(hideCompletedToggle.checked)
    );
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  renderTaskList();
}

function handleResetFiltersClick() {
  if (statusFilterSelect) statusFilterSelect.value = "all";
  if (categoryFilterSelect) categoryFilterSelect.value = "all";
  if (sortOrderSelect) sortOrderSelect.value = "created_desc";
  if (hideCompletedToggle) hideCompletedToggle.checked = false;
  if (searchInputElement) searchInputElement.value = "";

  try {
    globalThis.localStorage?.setItem(STATUS_FILTER_STORAGE_KEY, "all");
    globalThis.localStorage?.setItem(CATEGORY_FILTER_STORAGE_KEY, "all");
    globalThis.localStorage?.setItem(SORT_ORDER_STORAGE_KEY, "created_desc");
    globalThis.localStorage?.setItem(HIDE_COMPLETED_STORAGE_KEY, "false");
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  renderTaskList();
}

function handleCompactModeClick() {
  const enabled = !rootElement.classList.contains("compact-mode");
  applyCompactMode(enabled, true);
}

function renderTaskList() {
  const query = (searchInputElement?.value || "").trim().toLowerCase();
  const statusFilter = statusFilterSelect?.value || "all";
  const categoryFilter = categoryFilterSelect?.value || "all";
  const sortOrder = sortOrderSelect?.value || "created_desc";
  const hideCompleted = Boolean(hideCompletedToggle?.checked);

  const filteredTasks = getFilteredTasks(
    tasks,
    query,
    statusFilter,
    categoryFilter,
    hideCompleted
  );
  const sortedTasks = sortTasks(filteredTasks, sortOrder);

  if (taskListElement) {
    taskListElement.innerHTML = sortedTasks.map((task) => taskItemTemplate(task)).join("");
  }

  if (emptyStateElement) {
    const isEmpty = sortedTasks.length === 0;
    emptyStateElement.classList.toggle("hidden", !isEmpty);

    if (isEmpty) {
      emptyStateElement.textContent = getEmptyStateMessage(
        tasks,
        query,
        statusFilter,
        categoryFilter,
        hideCompleted
      );
    }
  }

  syncBulkActionButtons();
  updateStatsSummary();
}

function getFilteredTasks(taskList, query, statusFilter, categoryFilter, hideCompleted = false) {
  return taskList.filter((task) => {
    const haystack = `${task.title} ${task.category} ${task.priority}`.toLowerCase();

    if (query && !haystack.includes(query)) {
      return false;
    }

    if (statusFilter === "pending" && task.done) {
      return false;
    }

    if (statusFilter === "done" && !task.done) {
      return false;
    }

    if (categoryFilter !== "all" && task.category !== categoryFilter) {
      return false;
    }

    if (hideCompleted && task.done) {
      return false;
    }

    return true;
  });
}

function sortTasks(taskList, sortOrder) {
  const priorityScore = {
    Alta: 3,
    Media: 2,
    Baja: 1,
  };

  return [...taskList].sort((a, b) => {
    if (sortOrder === "created_asc") {
      return Number(a.createdAt || 0) - Number(b.createdAt || 0);
    }

    if (sortOrder === "priority_desc") {
      return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
    }

    if (sortOrder === "title_asc") {
      return a.title.localeCompare(b.title, "es", { sensitivity: "base" });
    }

    if (sortOrder === "title_desc") {
      return b.title.localeCompare(a.title, "es", { sensitivity: "base" });
    }

    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });
}

function taskItemTemplate(task) {
  const safeTitle = escapeHTML(task.title || "");
  const safeCategory = escapeHTML(task.category || "Personal");
  const safePriority = escapeHTML(task.priority || "Media");
  const safeId = escapeHTML(task.id || "");
  const dueDateBlock = task.dueDate
    ? `<span class="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">📅 ${escapeHTML(
        formatDueDate(task.dueDate)
      )}</span>`
    : "";

  const doneClasses = task.done
    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40";

  const titleClasses = task.done
    ? "line-through text-slate-400 dark:text-slate-500"
    : "text-slate-800 dark:text-slate-100";

  return `
    <li
      data-id="${safeId}"
      class="rounded-2xl border p-3 shadow-sm transition ${doneClasses}"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold ${titleClasses}" title="${safeTitle}">${safeTitle}</p>
          <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            ${badgeLabel(safeCategory)}
            ${badgePriority(safePriority)}
            ${dueDateBlock}
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-1">
          <button
            data-action="toggle"
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Marcar como ${task.done ? "pendiente" : "completada"}"
          >
            ${task.done ? "↩️" : "✅"}
          </button>
          <button
            data-action="edit"
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Editar título"
          >
            ✏️
          </button>
          <button
            data-action="delete"
            type="button"
            class="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            title="Eliminar tarea"
          >
            🗑
          </button>
        </div>
      </div>
    </li>
  `;
}

function badgeLabel(text) {
  return `<span class="rounded-full border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-200">${text}</span>`;
}

function badgePriority(priority) {
  const priorityClassMap = {
    Alta: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
    Media:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    Baja: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  };

  const classes =
    priorityClassMap[priority] ||
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return `<span class="rounded-full border px-2 py-1 text-[11px] font-semibold ${classes}">${priority}</span>`;
}

function initializeTheme() {
  try {
    const savedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "dark") {
      rootElement.classList.add("dark");
    } else {
      rootElement.classList.remove("dark");
    }
  } catch {
    rootElement.classList.remove("dark");
  }

  syncThemeIcon();
}

function restoreStatusFilter() {
  if (!statusFilterSelect) return;

  try {
    const saved = globalThis.localStorage?.getItem(STATUS_FILTER_STORAGE_KEY);
    if (saved && ["all", "pending", "done"].includes(saved)) {
      statusFilterSelect.value = saved;
    }
  } catch {
    // Sin persistencia si falla almacenamiento.
  }
}

function restoreCategoryFilter() {
  if (!categoryFilterSelect) return;

  try {
    const saved = globalThis.localStorage?.getItem(CATEGORY_FILTER_STORAGE_KEY);
    if (saved && ["all", ...ALLOWED_CATEGORIES].includes(saved)) {
      categoryFilterSelect.value = saved;
    }
  } catch {
    // Sin persistencia si falla almacenamiento.
  }
}

function restoreSortOrder() {
  if (!sortOrderSelect) return;

  try {
    const saved = globalThis.localStorage?.getItem(SORT_ORDER_STORAGE_KEY);
    const allowedSorts = [
      "created_desc",
      "created_asc",
      "priority_desc",
      "title_asc",
      "title_desc",
    ];

    if (saved && allowedSorts.includes(saved)) {
      sortOrderSelect.value = saved;
    }
  } catch {
    // Sin persistencia si falla almacenamiento.
  }
}

function restoreHideCompletedPreference() {
  if (!hideCompletedToggle) return;

  try {
    const saved = globalThis.localStorage?.getItem(HIDE_COMPLETED_STORAGE_KEY);
    hideCompletedToggle.checked = saved === "true";
  } catch {
    hideCompletedToggle.checked = false;
  }
}

function restoreCompactModePreference() {
  try {
    const saved = globalThis.localStorage?.getItem(COMPACT_MODE_STORAGE_KEY);
    applyCompactMode(saved === "true", false);
  } catch {
    applyCompactMode(false, false);
  }
}

function applyCompactMode(enabled, persist = false) {
  rootElement.classList.toggle("compact-mode", Boolean(enabled));

  if (persist) {
    try {
      globalThis.localStorage?.setItem(COMPACT_MODE_STORAGE_KEY, String(Boolean(enabled)));
    } catch {
      // Sin persistencia si falla almacenamiento.
    }
  }

  syncBulkActionButtons();
}

function getEmptyStateMessage(taskList, query, statusFilter, categoryFilter, hideCompleted) {
  if (taskList.length === 0) {
    return "No hay tareas todavía. Crea la primera desde el formulario.";
  }

  if (query) {
    return "No hay tareas que coincidan con la búsqueda.";
  }

  if (hideCompleted) {
    return "No hay tareas pendientes visibles porque estás ocultando las completadas.";
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

function syncBulkActionButtons() {
  if (markAllDoneButton) {
    const allDone = tasks.length > 0 && tasks.every((task) => task.done);
    markAllDoneButton.textContent = allDone
      ? "↩️ Desmarcar todas"
      : "✅ Marcar todas hechas";
    markAllDoneButton.disabled = tasks.length === 0;
    markAllDoneButton.classList.toggle("opacity-50", tasks.length === 0);
    markAllDoneButton.classList.toggle("cursor-not-allowed", tasks.length === 0);
  }

  if (compactModeButton) {
    const compactEnabled = rootElement.classList.contains("compact-mode");
    compactModeButton.textContent = compactEnabled ? "📐 Vista normal" : "📐 Compacto";
  }
}

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

function handleThemeToggle() {
  rootElement.classList.toggle("dark");

  try {
    const mode = rootElement.classList.contains("dark") ? "dark" : "light";
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Sin persistencia si falla almacenamiento.
  }

  syncThemeIcon();
}

function syncThemeIcon() {
  if (!themeIconElement) return;
  themeIconElement.textContent = rootElement.classList.contains("dark") ? "🌙" : "☀️";
}

function formatDueDate(rawDate) {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function escapeHTML(value) {
  const safeValue = String(value ?? "");

  return safeValue.replace(/[&<>"']/g, (match) => {
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
