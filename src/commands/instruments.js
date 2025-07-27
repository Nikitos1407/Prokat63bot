const { Markup } = require('telegraf');

module.exports = (bot, tools) => {
  bot.hears('📋 Список инструментов', ctx => {
    const buttons = tools.map(t => [Markup.button.callback(`${t.name} — ${t.price}₽`, t.id)]);
    ctx.reply('Выберите инструмент:', Markup.inlineKeyboard(buttons));
  });

  tools.forEach(tool => {
    bot.action(tool.id, async ctx => {
      await ctx.answerCbQuery();
      await ctx.replyWithPhoto(tool.photo, {
        caption:
`🛠 *${tool.name}*

${tool.description}

💰 *Цена:* ${tool.price} ₽/сутки
🔐 *Залог:* ${tool.deposit} ₽`,
        parse_mode: 'Markdown',
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)],
          [Markup.button.callback('🏠 Меню', 'go_menu')]
        ])
      });
    });
  });
};
