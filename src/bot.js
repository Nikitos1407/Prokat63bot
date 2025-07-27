const { Telegraf, Markup, session } = require('telegraf');
const { BOT_TOKEN, OWNER_ID } = require('./config');
const { userStates, userHistory } = require('./utils/storage');
const { isValidDate, parseDate, getRentalDays } = require('./utils/date');
const tools = require('./data/tools');
const { mainMenu } = require('./menus');

if (!BOT_TOKEN || !OWNER_ID) {
  console.error('Ошибка: BOT_TOKEN или OWNER_ID не задан.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());
bot.on('message', ctx => {
  ctx.reply('Я получил твое сообщение!');
});

// Команды
require('./commands/start')(bot, mainMenu);
require('./commands/menu')(bot, mainMenu);
require('./commands/instruments')(bot, tools);
require('./commands/rental')(bot, tools, userStates, userHistory, isValidDate, parseDate, getRentalDays);
require('./commands/history')(bot, userHistory);
require('./commands/misc')(bot);

module.exports = bot;
