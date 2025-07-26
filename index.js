require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;
const rentalState = new Map();

bot.use(session());

// 🧰 Инструменты
const tools = [
  {
    id: 'perforator',
    name: 'Перфоратор Makita РК2470',
    price: 1400,
    deposit: 5000,
    description: 'Мощный и надёжный перфоратор для бурения бетона, кирпича и прочих строительных работ.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/molotok-original1.jpg'
  },
  {
    id: 'vibro',
    name: 'Виброплита Champion PC9045F',
    price: 1800,
    deposit: 5000,
    description: 'Бензиновая виброплита 4.8 кВт для уплотнения грунта, тротуарной плитки, щебня.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/vibroplate-original1.jpg'
  },
  {
    id: 'mixer',
    name: 'Строительный миксер Ресанта СМ-1600Э-2',
    price: 850,
    deposit: 3000,
    description: 'Инструмент для замеса строительных смесей. Удобная двухскоростная модель.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/mikser-original1.jpg'
  }
];

// 📋 Главное меню
const mainMenu = Markup.keyboard([
  ['📋 Список инструментов', '📦 Как арендовать'],
  ['📞 Связаться с нами', '💬 Отзывы'],
  ['⚙️ О нас']
]).resize();

// /start
bot.start(async (ctx) => {
  const welcome = `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Выберите пункт меню ниже или нажмите /menu`;

  await ctx.replyWithPhoto(
    { url: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png' },
    {
      caption: welcome,
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// /menu
bot.command('menu', async (ctx) => {
  await ctx.reply('🏠 Главное меню', mainMenu);
});

// 📋 Список инструментов
bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(tool => [Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)]);
  await ctx.reply('Выберите инструмент:', Markup.inlineKeyboard(buttons));
});

// 📦 Как арендовать
bot.hears('📦 Как арендовать', async (ctx) => {
  await ctx.reply(`1. Выберите инструмент из списка.
2. Нажмите "Арендовать".
3. Укажите имя, телефон и даты аренды.
4. Мы свяжемся с вами и подтвердим заказ.`);
});

// 📞 Контакты
bot.hears('📞 Связаться с нами', (ctx) => {
  ctx.reply(`📱 Telegram: @ProkatinstrumentaNSK\n📍 Адрес: Новокуйбышевск, гаражный бокс\n🕘 9:00–21:00`);
});

// 💬 Отзывы
bot.hears('💬 Отзывы', (ctx) => {
  ctx.reply('💬 Мы будем рады вашему отзыву! Просто напишите его здесь, и мы обязательно прочитаем.');
});

// ⚙️ О нас
bot.hears('⚙️ О нас', (ctx) => {
  ctx.reply(`Прокат строительного инструмента в Новокуйбышевске.
✅ Надёжно
✅ Доступно
✅ Удобно`);
});

// Инфо об инструменте + кнопка "Арендовать"
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*\n\n${tool.description}\n\n💰 *Цена:* ${tool.price} ₽ / сутки\n🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)],
        [Markup.button.callback('🏠 Меню', 'back_to_menu')]
      ])
    });
  });

  bot.action(`rent_${tool.id}`, async (ctx) => {
    const chatId = ctx.chat.id;
    rentalState.set(chatId, { tool });
    await ctx.reply('👤 Введите ваше имя:');
  });
});

// Назад в меню
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('🏠 Главное меню', mainMenu);
});

// Обработка пошаговой аренды
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = rentalState.get(chatId);
  if (!state) return;

  if (!state.name) {
    state.name = ctx.message.text;
    return ctx.reply('📞 Введите ваш номер телефона (только цифры):');
  }

  if (!state.phone) {
    const phone = ctx.message.text.replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 15) {
      return ctx.reply('❗ Введите корректный номер телефона (только цифры, без пробелов и символов):');
    }
    state.phone = phone;
    return ctx.reply('📅 Введите дату начала аренды (в формате ДД.ММ.ГГГГ):');
  }

  if (!state.startDate) {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(ctx.message.text)) {
      return ctx.reply('❗ Неверный формат. Введите дату начала аренды в формате ДД.ММ.ГГГГ:');
    }
    state.startDate = ctx.message.text;
    return ctx.reply('📅 Введите дату конца аренды (в формате ДД.ММ.ГГГГ):');
  }

  if (!state.endDate) {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(ctx.message.text)) {
      return ctx.reply('❗ Неверный формат. Введите дату конца аренды в формате ДД.ММ.ГГГГ:');
    }
    state.endDate = ctx.message.text;

    const confirm = `📝 Проверьте данные:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 Начало: ${state.startDate}
📅 Конец: ${state.endDate}

Подтвердить заказ? (да / нет)`;

    return ctx.reply(confirm);
  }

  if (!state.confirmed) {
    const answer = ctx.message.text.toLowerCase();
    if (answer === 'да') {
      const msg = `📥 Заявка:\n\n🔧 Инструмент: ${state.tool.name}\n👤 Имя: ${state.name}\n📞 Телефон: ${state.phone}\n📅 Срок: ${state.startDate} — ${state.endDate}`;
      await ctx.telegram.sendMessage(ownerId, msg);
      await ctx.reply('✅ Заявка отправлена! Спасибо, что выбрали нас. Отличного дня! 🌞');
    } else {
      await ctx.reply('❌ Заявка отменена.');
    }
    rentalState.delete(chatId);
  }
});

bot.launch();
console.log('🤖 Бот запущен');
