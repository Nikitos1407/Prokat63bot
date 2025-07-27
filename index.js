const bot = require('./src/bot');
require('./src/server');

bot.launch()
  .then(() => console.log('🤖 Бот запущен (polling)'))
  .catch(err => console.error('❌ Ошибка запуска бота:', err));
