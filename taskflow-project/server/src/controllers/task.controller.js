const taskService = require('../services/task.service');

function getTasks(req, res, next) {
  try {
    const tasks = taskService.getAllTasks();
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
}

function createTask(req, res, next) {
  try {
    const { title, category, priority, dueDate } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res
        .status(400)
        .json({ error: 'El título es obligatorio y debe tener al menos 3 caracteres.' });
    }

    if (
      category !== undefined &&
      (typeof category !== 'string' || !taskService.ALLOWED_CATEGORIES.includes(category))
    ) {
      return res.status(400).json({ error: 'La categoría no es válida.' });
    }

    if (
      priority !== undefined &&
      (typeof priority !== 'string' || !taskService.ALLOWED_PRIORITIES.includes(priority))
    ) {
      return res.status(400).json({ error: 'La prioridad no es válida.' });
    }

    if (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string') {
      return res.status(400).json({ error: 'La fecha objetivo debe ser texto en formato YYYY-MM-DD o null.' });
    }

    const task = taskService.createTask({
      title,
      category,
      priority,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
}

function patchTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, category, priority, done, dueDate } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        return res
          .status(400)
          .json({ error: 'Si envías título, debe ser texto y tener al menos 3 caracteres.' });
      }
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !taskService.ALLOWED_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'La categoría no es válida.' });
      }
    }

    if (priority !== undefined) {
      if (typeof priority !== 'string' || !taskService.ALLOWED_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: 'La prioridad no es válida.' });
      }
    }

    if (done !== undefined && typeof done !== 'boolean') {
      return res.status(400).json({ error: 'El campo done debe ser booleano.' });
    }

    if (dueDate !== undefined && dueDate !== null && typeof dueDate !== 'string') {
      return res.status(400).json({ error: 'La fecha objetivo debe ser texto en formato YYYY-MM-DD o null.' });
    }

    const updates = {};

    if (title !== undefined) updates.title = title;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (done !== undefined) updates.done = done;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    const task = taskService.updateTask(id, updates);
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
}

function deleteTask(req, res, next) {
  try {
    taskService.deleteTask(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
};
