module.exports = (bot, mainMenu) => {
  bot.start(ctx => ctx.replyWithPhoto(
    'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png',
    {
      caption:
`👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 Гаражный бокс (Новокуйбышевск)
🕘 9:00–21:00
💵 наличные / перевод

Нажмите кнопку ниже или /menu`,
      parse_mode: 'Markdown',
      reply_markup: mainMenu
    }
  ));
};
