/* eslint-disable no-alert */
'use strict';

const selectElement = (selector) => document.querySelector(selector);
const rootElement = document.documentElement;

const themeToggleButton = selectElement('#themeBtn');
const themeIconElement = selectElement('#themeIcon');
const taskFormElement = selectElement('#taskForm');
const taskTitleInput = selectElement('#taskInput');
const taskCategorySelect = selectElement('#taskCategory');
const taskPrioritySelect = selectElement('#taskPriority');
const taskDueDateInput = selectElement('#taskDueDate');
const formErrorElement = selectElement('#formError');
const taskListElement = selectElement('#taskList');
const emptyStateElement = selectElement('#emptyState');
const clearTasksButton = selectElement('#clearBtn');
const searchInputElement = selectElement('#searchInput');
const statusFilterSelect = selectElement('#statusFilter');
const categoryFilterSelect = selectElement('#categoryFilter');
const sortOrderSelect = selectElement('#sortOrder');
const demoTasksButton = selectElement('#demoTasksBtn');
const hideCompletedToggle = selectElement('#hideCompletedToggle');
const markAllDoneButton = selectElement('#markAllDoneBtn');
const resetFiltersButton = selectElement('#resetFiltersBtn');
const compactModeButton = selectElement('#compactModeBtn');
const statsSummaryElement = selectElement('#statsSummary');
const loadingStateElement = selectElement('#loadingState');
const networkErrorElement = selectElement('#networkError');

const THEME_STORAGE_KEY = 'taskflow_theme';
const STATUS_FILTER_STORAGE_KEY = 'taskflow_status_filter';
const CATEGORY_FILTER_STORAGE_KEY = 'taskflow_category_filter';
const SORT_ORDER_STORAGE_KEY = 'taskflow_sort_order';
const HIDE_COMPLETED_STORAGE_KEY = 'taskflow_hide_completed';
const COMPACT_MODE_STORAGE_KEY = 'taskflow_compact_mode';
const ALLOWED_CATEGORIES = ['Estudio', 'Trabajo', 'Personal'];
const ALLOWED_PRIORITIES = ['Baja', 'Media', 'Alta'];

let tasks = [];
let isLoading = false;
let serverErrorMessage = '';

initializeTheme();
restoreStatusFilter();
restoreCategoryFilter();
restoreSortOrder();
restoreHideCompletedPreference();
restoreCompactModePreference();
registerEventListeners();
renderTaskList();
loadTasksFromServer();

function registerEventListeners() {
  themeToggleButton?.addEventListener('click', handleThemeToggle);
  taskFormElement?.addEventListener('submit', handleTaskFormSubmit);
  clearTasksButton?.addEventListener('click', handleClearTasksClick);
  searchInputElement?.addEventListener('input', renderTaskList);
  taskListElement?.addEventListener('click', handleTaskListClick);
  statusFilterSelect?.addEventListener('change', handleStatusFilterChange);
  categoryFilterSelect?.addEventListener('change', handleCategoryFilterChange);
  sortOrderSelect?.addEventListener('change', handleSortOrderChange);
  demoTasksButton?.addEventListener('click', handleDemoTasksClick);
  hideCompletedToggle?.addEventListener('change', handleHideCompletedToggleChange);
  markAllDoneButton?.addEventListener('click', handleMarkAllDoneClick);
  resetFiltersButton?.addEventListener('click', handleResetFiltersClick);
  compactModeButton?.addEventListener('click', handleCompactModeClick);
}

async function loadTasksFromServer() {
  setLoading(true);
  clearServerError();

  try {
    tasks = await getTasksRequest();
  } catch (error) {
    setServerError(error.message);
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

async function handleTaskFormSubmit(event) {
  event.preventDefault();

  const rawTitle = taskTitleInput?.value?.trim() ?? '';
  const rawCategory = taskCategorySelect?.value ?? '';
  const rawPriority = taskPrioritySelect?.value ?? '';
  const rawDueDate = taskDueDateInput?.value ?? '';

  const validationError = validateTaskForm(rawTitle, rawCategory, rawPriority);
  if (validationError) {
    setFormError(validationError);
    return;
  }

  clearFormError();
  setLoading(true);
  clearServerError();

  try {
    const createdTask = await createTaskRequest({
      title: rawTitle,
      category: normalizeCategory(rawCategory),
      priority: normalizePriority(rawPriority),
      dueDate: rawDueDate || null,
    });

    tasks = [createdTask, ...tasks];
    taskFormElement?.reset();
    if (taskPrioritySelect) taskPrioritySelect.value = 'Media';
    taskTitleInput?.focus();
  } catch (error) {
    setServerError(error.message);
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

function validateTaskForm(title, category, priority) {
  if (!title) return 'El título no puede estar vacío.';
  if (title.length < 3) return 'El título debe tener al menos 3 caracteres.';
  if (title.length > 120) return 'El título es demasiado largo (máx. 120 caracteres).';
  if (category && !ALLOWED_CATEGORIES.includes(category)) return 'La categoría seleccionada no es válida.';
  if (priority && !ALLOWED_PRIORITIES.includes(priority)) return 'La prioridad seleccionada no es válida.';
  return null;
}

function normalizeCategory(category) {
  return ALLOWED_CATEGORIES.includes(category) ? category : 'Personal';
}

function normalizePriority(priority) {
  return ALLOWED_PRIORITIES.includes(priority) ? priority : 'Media';
}

function setFormError(message) {
  if (!formErrorElement) return;
  formErrorElement.textContent = message;
  formErrorElement.classList.remove('hidden');
}

function clearFormError() {
  if (!formErrorElement) return;
  formErrorElement.textContent = '';
  formErrorElement.classList.add('hidden');
}

function setLoading(value) {
  isLoading = value;
  loadingStateElement?.classList.toggle('hidden', !value);
  taskFormElement?.querySelectorAll('button, input, select').forEach((element) => {
    element.disabled = value;
  });
}

function setServerError(message) {
  serverErrorMessage = message;
  if (!networkErrorElement) return;
  networkErrorElement.textContent = message;
  networkErrorElement.classList.remove('hidden');
}

function clearServerError() {
  serverErrorMessage = '';
  if (!networkErrorElement) return;
  networkErrorElement.textContent = '';
  networkErrorElement.classList.add('hidden');
}

async function handleClearTasksClick() {
  if (tasks.length === 0) return;

  setLoading(true);
  clearServerError();

  try {
    await Promise.all(tasks.map((task) => deleteTaskRequest(task.id)));
    tasks = [];
  } catch (error) {
    setServerError(error.message);
    await loadTasksFromServer();
    return;
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

async function handleTaskListClick(event) {
  const clickedButton = event.target.closest('[data-action]');
  if (!clickedButton) return;

  const listItem = clickedButton.closest('li');
  const taskId = listItem?.dataset?.id;
  if (!taskId) return;

  const action = clickedButton.dataset.action;
  const taskToEdit = tasks.find((task) => task.id === taskId);
  if (!taskToEdit) return;

  setLoading(true);
  clearServerError();

  try {
    if (action === 'toggle') {
      const updatedTask = await updateTaskRequest(taskId, { done: !taskToEdit.done });
      tasks = tasks.map((task) => (task.id === taskId ? updatedTask : task));
    }

    if (action === 'delete') {
      await deleteTaskRequest(taskId);
      tasks = tasks.filter((task) => task.id !== taskId);
    }

    if (action === 'edit') {
      setLoading(false);
      const nextTitle = globalThis.prompt('Nuevo título de la tarea:', taskToEdit.title);
      if (nextTitle == null) {
        renderTaskList();
        return;
      }

      const trimmedTitle = nextTitle.trim();
      const validationError = validateTaskForm(trimmedTitle, taskToEdit.category, taskToEdit.priority);
      if (validationError) {
        globalThis.alert(validationError);
        renderTaskList();
        return;
      }

      setLoading(true);
      const updatedTask = await updateTaskRequest(taskId, { title: trimmedTitle });
      tasks = tasks.map((task) => (task.id === taskId ? updatedTask : task));
    }
  } catch (error) {
    setServerError(error.message);
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

function handleStatusFilterChange() {
  if (!statusFilterSelect) return;
  globalThis.localStorage?.setItem(STATUS_FILTER_STORAGE_KEY, statusFilterSelect.value);
  renderTaskList();
}

function handleCategoryFilterChange() {
  if (!categoryFilterSelect) return;
  globalThis.localStorage?.setItem(CATEGORY_FILTER_STORAGE_KEY, categoryFilterSelect.value);
  renderTaskList();
}

function handleSortOrderChange() {
  if (!sortOrderSelect) return;
  globalThis.localStorage?.setItem(SORT_ORDER_STORAGE_KEY, sortOrderSelect.value);
  renderTaskList();
}

async function handleMarkAllDoneClick() {
  if (tasks.length === 0) return;

  const shouldMarkAllAsDone = tasks.some((task) => !task.done);
  setLoading(true);
  clearServerError();

  try {
    const updatedTasks = await Promise.all(
      tasks.map((task) => updateTaskRequest(task.id, { done: shouldMarkAllAsDone }))
    );
    tasks = updatedTasks;
  } catch (error) {
    setServerError(error.message);
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

async function handleDemoTasksClick() {
  const demoTasks = [
    { title: 'Preparar presentación de ShareTasks', category: 'Trabajo', priority: 'Alta', dueDate: null },
    { title: 'Repasar JavaScript del proyecto', category: 'Estudio', priority: 'Media', dueDate: null },
    { title: 'Comprar productos de limpieza del piso', category: 'Personal', priority: 'Baja', dueDate: null },
    { title: 'Organizar tareas de la semana con el grupo', category: 'Trabajo', priority: 'Alta', dueDate: null },
  ];

  const existingTitles = new Set(tasks.map((task) => task.title.trim().toLowerCase()));
  const newDemoTasks = demoTasks.filter((task) => !existingTitles.has(task.title.trim().toLowerCase()));
  if (newDemoTasks.length === 0) return;

  setLoading(true);
  clearServerError();

  try {
    const createdTasks = await Promise.all(newDemoTasks.map((task) => createTaskRequest(task)));
    tasks = [...createdTasks, ...tasks];
  } catch (error) {
    setServerError(error.message);
  } finally {
    setLoading(false);
    renderTaskList();
  }
}

function handleHideCompletedToggleChange() {
  if (!hideCompletedToggle) return;
  globalThis.localStorage?.setItem(HIDE_COMPLETED_STORAGE_KEY, String(hideCompletedToggle.checked));
  renderTaskList();
}

function handleResetFiltersClick() {
  if (searchInputElement) searchInputElement.value = '';
  if (statusFilterSelect) statusFilterSelect.value = 'all';
  if (categoryFilterSelect) categoryFilterSelect.value = 'all';
  if (sortOrderSelect) sortOrderSelect.value = 'created_desc';
  if (hideCompletedToggle) hideCompletedToggle.checked = false;

  globalThis.localStorage?.setItem(STATUS_FILTER_STORAGE_KEY, 'all');
  globalThis.localStorage?.setItem(CATEGORY_FILTER_STORAGE_KEY, 'all');
  globalThis.localStorage?.setItem(SORT_ORDER_STORAGE_KEY, 'created_desc');
  globalThis.localStorage?.setItem(HIDE_COMPLETED_STORAGE_KEY, 'false');

  renderTaskList();
}

function handleCompactModeClick() {
  const compactModeEnabled = !rootElement.classList.contains('compact-mode');
  applyCompactMode(compactModeEnabled, true);
  renderTaskList();
}

function renderTaskList() {
  if (!taskListElement || !emptyStateElement) return;

  const query = searchInputElement?.value?.trim().toLowerCase() ?? '';
  const statusFilter = statusFilterSelect?.value ?? 'all';
  const categoryFilter = categoryFilterSelect?.value ?? 'all';
  const hideCompleted = hideCompletedToggle?.checked ?? false;

  const filteredTasks = getFilteredTasks(tasks, query, statusFilter, categoryFilter, hideCompleted);
  const sortedTasks = sortTasks(filteredTasks, sortOrderSelect?.value ?? 'created_desc');

  taskListElement.innerHTML = sortedTasks.map(taskItemTemplate).join('');
  emptyStateElement.classList.toggle('hidden', sortedTasks.length !== 0 || isLoading);
  emptyStateElement.textContent = getEmptyStateMessage(tasks, query, statusFilter, categoryFilter, hideCompleted);

  syncBulkActionButtons();
  updateStatsSummary();
}

function getFilteredTasks(taskList, query, statusFilter, categoryFilter, hideCompleted = false) {
  let result = taskList;

  if (query) {
    result = result.filter((task) => {
      const titleMatch = task.title.toLowerCase().includes(query);
      const categoryMatch = task.category.toLowerCase().includes(query);
      const priorityMatch = task.priority.toLowerCase().includes(query);
      return titleMatch || categoryMatch || priorityMatch;
    });
  }

  if (statusFilter === 'pending') result = result.filter((task) => !task.done);
  else if (statusFilter === 'done') result = result.filter((task) => task.done);

  if (categoryFilter !== 'all') result = result.filter((task) => task.category === categoryFilter);
  if (hideCompleted) result = result.filter((task) => !task.done);

  return result;
}

function sortTasks(taskList, sortOrder) {
  const tasksCopy = [...taskList];

  if (sortOrder === 'created_asc') return tasksCopy.sort((a, b) => a.createdAt - b.createdAt);

  if (sortOrder === 'priority_desc') {
    const priorityRank = { Alta: 3, Media: 2, Baja: 1 };
    return tasksCopy.sort((a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0));
  }

  if (sortOrder === 'title_asc') {
    return tasksCopy.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
  }

  if (sortOrder === 'title_desc') {
    return tasksCopy.sort((a, b) => b.title.localeCompare(a.title, 'es', { sensitivity: 'base' }));
  }

  return tasksCopy.sort((a, b) => b.createdAt - a.createdAt);
}

function taskItemTemplate(task) {
  const compactModeEnabled = rootElement.classList.contains('compact-mode');
  const titleClass = task.done
    ? 'text-slate-400 line-through dark:text-slate-500'
    : 'text-slate-900 dark:text-slate-100';
  const itemClass = compactModeEnabled
    ? 'group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition duration-200 hover:shadow dark:border-slate-800 dark:bg-slate-950/30'
    : 'group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow dark:border-slate-800 dark:bg-slate-950/30';
  const toggleButtonClass = compactModeEnabled
    ? 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600'
    : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition duration-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600';
  const actionButtonClass = compactModeEnabled
    ? 'inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold shadow-sm transition duration-200 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600 sm:opacity-0 sm:group-hover:opacity-100'
    : 'inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:ring-slate-600 sm:opacity-0 sm:group-hover:opacity-100';
  const metaSpacingClass = compactModeEnabled
    ? 'mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]'
    : 'mt-2 flex flex-wrap items-center gap-2 text-xs';
  const titleSizeClass = compactModeEnabled ? 'truncate text-xs font-medium' : 'truncate text-sm font-medium';
  const dueDateMarkup = task.dueDate ? badgeLabel(`📅 ${task.dueDate}`) : '';

  return `
    <li data-id="${task.id}" class="${itemClass}">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <button data-action="toggle" class="${toggleButtonClass}" title="Hecha / Pendiente" aria-label="Hecha / Pendiente">
            ${task.done ? '✅' : '⬜'}
          </button>

          <p class="${titleSizeClass} ${titleClass}">${escapeHTML(task.title)}</p>
        </div>

        <div class="${metaSpacingClass}">
          ${badgeLabel(task.category)}
          ${badgePriority(task.priority)}
          ${dueDateMarkup}
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button data-action="edit" class="${actionButtonClass}" title="Editar" aria-label="Editar">✏️ <span class="hidden sm:inline">Editar</span></button>
        <button data-action="delete" class="${actionButtonClass}" title="Eliminar" aria-label="Eliminar">🗑 <span class="hidden sm:inline">Borrar</span></button>
      </div>
    </li>
  `;
}

function badgeLabel(text) {
  return `<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">${escapeHTML(text)}</span>`;
}

function badgePriority(priority) {
  if (priority === 'Alta') {
    return '<span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-100">🔥 Alta</span>';
  }
  if (priority === 'Media') {
    return '<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">⚡ Media</span>';
  }
  return '<span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">🌿 Baja</span>';
}

function initializeTheme() {
  const savedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark') rootElement.classList.add('dark');
  else if (savedTheme === 'light') rootElement.classList.remove('dark');
  syncThemeIcon();
}

function restoreStatusFilter() {
  if (!statusFilterSelect) return;
  const saved = globalThis.localStorage?.getItem(STATUS_FILTER_STORAGE_KEY);
  if (saved === 'all' || saved === 'pending' || saved === 'done') statusFilterSelect.value = saved;
}

function restoreCategoryFilter() {
  if (!categoryFilterSelect) return;
  const saved = globalThis.localStorage?.getItem(CATEGORY_FILTER_STORAGE_KEY);
  if (saved === 'all' || ALLOWED_CATEGORIES.includes(saved)) categoryFilterSelect.value = saved;
}

function restoreSortOrder() {
  if (!sortOrderSelect) return;
  const saved = globalThis.localStorage?.getItem(SORT_ORDER_STORAGE_KEY);
  const allowed = ['created_desc', 'created_asc', 'priority_desc', 'title_asc', 'title_desc'];
  if (saved && allowed.includes(saved)) sortOrderSelect.value = saved;
}

function restoreHideCompletedPreference() {
  if (!hideCompletedToggle) return;
  hideCompletedToggle.checked = globalThis.localStorage?.getItem(HIDE_COMPLETED_STORAGE_KEY) === 'true';
}

function restoreCompactModePreference() {
  applyCompactMode(globalThis.localStorage?.getItem(COMPACT_MODE_STORAGE_KEY) === 'true', false);
}

function applyCompactMode(enabled, persist = false) {
  rootElement.classList.toggle('compact-mode', enabled);
  if (taskListElement) taskListElement.className = enabled ? 'space-y-1' : 'space-y-2';
  if (persist) globalThis.localStorage?.setItem(COMPACT_MODE_STORAGE_KEY, String(enabled));
  syncBulkActionButtons();
}

function getEmptyStateMessage(taskList, query, statusFilter, categoryFilter, hideCompleted) {
  if (isLoading) return 'Cargando tareas desde el servidor...';
  if (serverErrorMessage && taskList.length === 0) return 'No se pudieron cargar las tareas.';
  if (taskList.length === 0) return 'No hay tareas todavía.';
  if (query) return 'No hay tareas que coincidan con la búsqueda.';
  if (hideCompleted) return 'No hay tareas pendientes visibles porque las completadas están ocultas.';
  if (statusFilter === 'pending') return 'No hay tareas pendientes.';
  if (statusFilter === 'done') return 'No hay tareas completadas.';
  if (categoryFilter !== 'all') return 'No hay tareas en esa categoría.';
  return 'No hay tareas para mostrar.';
}

function syncBulkActionButtons() {
  if (markAllDoneButton) {
    const allTasksDone = tasks.length > 0 && tasks.every((task) => task.done);
    markAllDoneButton.textContent = allTasksDone ? '↩️ Desmarcar todas' : '✅ Marcar todas hechas';
    markAllDoneButton.disabled = tasks.length === 0 || isLoading;
    markAllDoneButton.classList.toggle('opacity-50', tasks.length === 0 || isLoading);
    markAllDoneButton.classList.toggle('cursor-not-allowed', tasks.length === 0 || isLoading);
  }

  if (compactModeButton) {
    compactModeButton.textContent = rootElement.classList.contains('compact-mode') ? '📐 Vista normal' : '📐 Compacto';
  }
}

function updateStatsSummary() {
  if (!statsSummaryElement) return;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;
  const pendingTasks = totalTasks - completedTasks;

  if (isLoading) {
    statsSummaryElement.textContent = 'Sincronizando con el backend...';
    return;
  }

  if (totalTasks === 0) {
    statsSummaryElement.textContent = '0 tareas en total.';
    return;
  }

  statsSummaryElement.textContent = `${totalTasks} tareas · ${pendingTasks} pendientes · ${completedTasks} completadas`;
}

function handleThemeToggle() {
  rootElement.classList.toggle('dark');
  const mode = rootElement.classList.contains('dark') ? 'dark' : 'light';
  globalThis.localStorage?.setItem(THEME_STORAGE_KEY, mode);
  syncThemeIcon();
}

function syncThemeIcon() {
  if (!themeIconElement) return;
  themeIconElement.textContent = rootElement.classList.contains('dark') ? '🌙' : '☀️';
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (match) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return map[match] || match;
  });
}
