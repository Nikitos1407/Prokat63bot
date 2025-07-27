const { Markup } = require('telegraf');

module.exports = (bot, tools, userStates, userHistory, isValidDate, parseDate, getRentalDays) => {
  // Начало формы
  tools.forEach(tool => {
    bot.action(`rent_${tool.id}`, async ctx => {
      await ctx.answerCbQuery();
      userStates.set(ctx.chat.id, { step: 'name', tool });
      await ctx.reply('📍 Шаг 1 из 4 — Введите ваше имя:');
    });
  });

  // Повтор аренды
  tools.forEach(tool => {
    bot.action(`repeat_${tool.id}`, async ctx => {
      const last = (userHistory.get(ctx.chat.id) || []).slice(-1)[0] || {};
      userStates.set(ctx.chat.id, {
        step: 'startDate',
        tool,
        name: last.name || '',
        phone: last.phone || ''
      });
      await ctx.reply('📍 Повтор аренды — введите дату начала (ДД.MM.YYYY):');
    });
  });

  // Шаги формы
  bot.on('text', async ctx => {
    const state = userStates.get(ctx.chat.id);
    if (!state) return;
    const text = ctx.message.text.trim();

    if (state.step === 'name') {
      state.name = text;
      state.step = 'phone';
      return ctx.reply('📍 Шаг 2 из 4 — Введите номер телефона (только цифры):');
    }
    if (state.step === 'phone') {
      if (!/^\d{7,15}$/.test(text)) {
        return ctx.reply('❌ Неверный формат. Введите только цифры:');
      }
      state.phone = text;
      state.step = 'startDate';
      return ctx.reply('📍 Шаг 3 из 4 — Введите дату начала (ДД.MM.YYYY):');
    }
    if (state.step === 'startDate') {
      if (!isValidDate(text)) {
        return ctx.reply('❌ Неверный формат. Введите ДД.MM.YYYY:');
      }
      state.startDate = text;
      state.step = 'endDate';
      return ctx.reply('📍 Шаг 4 из 4 — Введите дату окончания (ДД.MM.YYYY):');
    }
    if (state.step === 'endDate') {
      if (!isValidDate(text)) {
        return ctx.reply('❌ Неверный формат. Введите ДД.MM.YYYY:');
      }
      state.endDate = text;

      const start = parseDate(state.startDate);
      const end   = parseDate(state.endDate);
      const days  = getRentalDays(start, end);
      const total = days * state.tool.price;
      state.days  = days;
      state.total = total;
      state.step  = 'confirm';

      return ctx.reply(
        `🔁 Проверьте данные:

` +
        `👤 Имя: ${state.name}
` +
        `📞 Телефон: ${state.phone}
` +
        `📅 С: ${state.startDate}
` +
        `📅 По: ${state.endDate} (${days} дн.)

` +
        `💰 Итого: ${state.tool.price}₽ × ${days} = ${total}₽
` +
        `🔐 Залог: ${state.tool.deposit}₽

` +
        `Подтвердить заказ?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Подтвердить', 'confirm')],
          [Markup.button.callback('❌ Отмена',    'cancel')],
          [Markup.button.callback('🏠 Меню',      'go_menu')]
        ])
      );
    }
  });

  // Подтверждение
  bot.action('confirm', async ctx => {
    const s = userStates.get(ctx.chat.id);
    if (!s) return;

    await ctx.telegram.sendMessage(process.env.OWNER_ID,
      `📥 Новая заявка:
` +
      `🔧 ${s.tool.name}
` +
      `👤 ${s.name}
` +
      `📞 ${s.phone}
` +
      `📅 ${s.startDate} → ${s.endDate} (${s.days} дн.)
` +
      `💰 Аренда: ${s.total}₽ + Залог: ${s.tool.deposit}₽`
    );

    await ctx.editMessageText('✅ Заявка отправлена!', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('🔁 Повторить', `repeat_${s.tool.id}`)]
      ])
    });

    const rec = {
      tool:      s.tool.name,
      name:      s.name,
      phone:     s.phone,
      startDate: s.startDate,
      endDate:   s.endDate,
      total:     s.total
    };
    if (!userHistory.has(ctx.chat.id)) userHistory.set(ctx.chat.id, []);
    userHistory.get(ctx.chat.id).push(rec);
    userStates.delete(ctx.chat.id);
  });

  // Отмена
  bot.action('cancel', async ctx => {
    userStates.delete(ctx.chat.id);
    await ctx.editMessageText('❌ Заявка отменена. Введите /menu');
  });

  // Меню из карточки
  bot.action('go_menu', async ctx => {
    await ctx.answerCbQuery();
    await ctx.reply('📲 Главное меню:', require('../menus').mainMenu);
  });
};
