const API_BASE_URL = globalThis.TASKFLOW_API_URL || 'http://localhost:3000/api/v1/tasks';

async function apiRequest(path = '', options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    const networkError = new Error('No se pudo conectar con el servidor.');
    networkError.code = 'NETWORK_ERROR';
    throw networkError;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error || 'Error de red al comunicar con el servidor.';
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function getTasksRequest() {
  return apiRequest();
}

async function createTaskRequest(taskData) {
  return apiRequest('', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

async function updateTaskRequest(id, updates) {
  return apiRequest(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

async function deleteTaskRequest(id) {
  return apiRequest(`/${id}`, {
    method: 'DELETE',
  });
}

globalThis.TaskflowApi = {
  getTasksRequest,
  createTaskRequest,
  updateTaskRequest,
  deleteTaskRequest,
};
