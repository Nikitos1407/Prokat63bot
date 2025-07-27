const express = require('express');
const { PORT } = require('./config');
const app = express();

app.get('/', (req, res) => res.send('🤖 Бот работает!'));

app.listen(PORT, '0.0.0.0', () =>
  console.log(`🌐 Сервер слушает порт ${PORT}`)
);

module.exports = app;
