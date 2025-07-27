module.exports = (bot, mainMenu) => {
  bot.command('menu', ctx => ctx.reply('📲 Главное меню:', mainMenu));
};
