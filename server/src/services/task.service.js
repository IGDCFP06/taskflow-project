let tasks = [];

const ALLOWED_CATEGORIES = ['Estudio', 'Trabajo', 'Personal'];
const ALLOWED_PRIORITIES = ['Baja', 'Media', 'Alta'];

function getAllTasks() {
  return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
}

function createTask(data) {
  const task = {
    id: globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: data.title.trim(),
    category: ALLOWED_CATEGORIES.includes(data.category) ? data.category : 'Personal',
    priority: ALLOWED_PRIORITIES.includes(data.priority) ? data.priority : 'Media',
    dueDate: data.dueDate || null,
    done: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  tasks.unshift(task);
  return task;
}

function deleteTask(id) {
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    throw new Error('NOT_FOUND');
  }

  tasks.splice(index, 1);
}

function updateTask(id, updates) {
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    throw new Error('NOT_FOUND');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
    task.title = updates.title.trim();
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'category')) {
    task.category = ALLOWED_CATEGORIES.includes(updates.category)
      ? updates.category
      : task.category;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'priority')) {
    task.priority = ALLOWED_PRIORITIES.includes(updates.priority)
      ? updates.priority
      : task.priority;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'done')) {
    task.done = updates.done;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'dueDate')) {
    task.dueDate = updates.dueDate || null;
  }

  task.updatedAt = Date.now();
  return task;
}

module.exports = {
  getAllTasks,
  createTask,
  deleteTask,
  updateTask,
  ALLOWED_CATEGORIES,
  ALLOWED_PRIORITIES,
};
