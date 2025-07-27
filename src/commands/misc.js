const { Markup } = require('telegraf');
module.exports = bot => {
  bot.hears('📦 Как арендовать', ctx =>
    ctx.reply('1️⃣ Выберите инструмент\n2️⃣ Нажмите "Арендовать"\n3️⃣ Заполните форму\n4️⃣ Мы свяжемся')
  );
  bot.hears('📍 Где забрать?', async ctx => {
    await ctx.replyWithLocation(53.101325, 49.965541);
    ctx.reply(
      `📍 Гаражный бокс, Новокуйбышевск\n` +
      `[Яндекс.Карты](https://yandex.ru/maps/?ll=49.965541%2C53.101325&z=18)\n` +
      `[2ГИС](https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.966093%2C53.100959%2F18.68)`,
      { parse_mode: 'Markdown' }
    );
  });
  bot.hears('📞 Позвонить', ctx =>
    ctx.reply('📞 Контакты:', Markup.inlineKeyboard([
      [Markup.button.url('📞 Позвонить', 'tel:+79991234567')],
      [Markup.button.url('💬 Telegram', 'https://t.me/ProkatinstrumentaNSK')]
    ]))
  );
  bot.hears('💬 Отзывы', ctx => ctx.reply('⭐️ Отзывы скоро появятся!'));
  bot.hears('⚙️ О нас', ctx => ctx.reply('🔧 Прокат Инструментов 63 — быстро и надёжно!'));
};
