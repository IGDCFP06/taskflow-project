En los siguientes experimentos de iA

Elige tres pequeños problemas de programación
Resuélvelos primero sin usar IA
Resuélvelos después con ayuda de IA
Compara tiempo invertido, calidad del código y comprensión del problema
Repite el experimento con tres tareas relacionadas con tu proyecto
Documenta todo el proceso en docs/ai/experiments.md

Solución sin usar IA
Primero se implementó manualmente una función en JavaScript.
function removeDuplicates(arr) {
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    if (!result.includes(arr[i])) {
      result.push(arr[i]);
    }
  }

  return result;
}
Tiempo invertido
10 minutos.
Dificultades
pensar en la lógica
comprobar si un elemento ya existe
Solución usando IA
Prompt utilizado:
Crea una función en JavaScript que elimine duplicados de un array.
Usa el método más simple posible.
Código generado por la IA:
function removeDuplicates(arr) {
  return [...new Set(arr)];
}
Tiempo invertido
2 minutos.
Comparación
Aspecto	Sin IA	Con IA
Tiempo	10 min	2 min
Calidad	Correcta	Más optimizada
Comprensión	Alta	Media
Problema 2 — Contar palabras en un texto
Solución sin IA
function countWords(text) {
  const words = text.trim().split(" ");
  return words.length;
}
Tiempo aproximado: 8 minutos
Problema detectado: no maneja espacios múltiples.
Solución con IA
Prompt utilizado:
Crea una función en JavaScript que cuente las palabras de un texto.
Debe manejar espacios múltiples correctamente.
Resultado:
function countWords(text) {
  return text.trim().split(/\s+/).length;
}
Comparación
Aspecto	Sin IA	Con IA
Tiempo	8 min	2 min
Calidad	Básica	Más robusta
Comprensión	Alta	Alta
Problema 3 — Generar números aleatorios
Sin IA
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
Tiempo: 5 minutos
Con IA
Prompt:
Escribe una función en JavaScript que genere un número aleatorio entre min y max.
Incluye ejemplo de uso.
Resultado similar.
Tiempo: 1 minuto
Parte 2 — Experimentos con el proyecto TaskFlow
El proyecto TaskFlow es una aplicación web de gestión de tareas construida con Tailwind CSS y JavaScript.
El archivo principal es index.html, que incluye:
formulario para añadir tareas
lista de tareas
buscador
tema oscuro
Tarea 1 — Añadir nueva tarea
Sin IA
Se implementó manualmente la función:
function addTask(title) {
  const li = document.createElement("li");
  li.textContent = title;
  document.getElementById("taskList").appendChild(li);
}
Tiempo: 15 minutos
Problemas encontrados:
manejo de eventos del formulario
limpieza del input
Con IA
Prompt utilizado:
Genera código JavaScript para añadir tareas a una lista HTML.
El formulario tiene id "taskForm" y el input tiene id "taskInput".
Resultado más completo.
Tiempo: 3 minutos
Tarea 2 — Búsqueda de tareas
Sin IA
Implementación manual:
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  const tasks = document.querySelectorAll("#taskList li");

  tasks.forEach(task => {
    const text = task.textContent.toLowerCase();
    task.style.display = text.includes(filter) ? "" : "none";
  });
});
Tiempo: 20 minutos
Con IA
Prompt:
Crea un buscador para una lista de tareas HTML.
Debe filtrar los elementos en tiempo real.
Tiempo: 3 minutos
Tarea 3 — Guardar tareas en localStorage
Sin IA
Código manual:
function saveTasks(tasks) {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}
Tiempo: 25 minutos
Dificultad:
serialización de datos
restaurar tareas al cargar la página
Con IA
Prompt utilizado:
Crea un sistema simple para guardar tareas en localStorage y cargarlas al iniciar la página.
Resultado: código completo con funciones saveTasks y loadTasks.
Tiempo: 4 minutos
