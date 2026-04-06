const express = require('express');
const cors = require('cors');
const { port, clientOrigin } = require('./config/env');
const taskRoutes = require('./routes/task.routes');
const { loggerAcademico } = require('./middlewares/logger.middleware');

const app = express();

app.use(
  cors({
    origin: clientOrigin === '*' ? true : clientOrigin,
  })
);
app.use(express.json());
app.use(loggerAcademico);

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ ok: true, message: 'TaskFlow API operativa' });
});

if (process.env.NODE_ENV !== 'production') {
  app.get('/api/v1/debug/error', (req, res, next) => {
    next(new Error('DEBUG_FORCE_500'));
  });
}

app.use('/api/v1/tasks', taskRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  if (err.message === 'NOT_FOUND') {
    return res.status(404).json({ error: 'La tarea no existe.' });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor TaskFlow escuchando en http://localhost:${port}`);
  });
}

module.exports = app;
