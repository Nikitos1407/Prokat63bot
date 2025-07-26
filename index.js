require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;

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
  },
  {
    id: 'auger',
    name: 'Мотобур Huter GGD-300 с комплектом',
    price: 1300,
    deposit: 5000,
    description: 'С шнеками (100–250 мм), удлинитель 1000 мм. Идеально для установки заборов, бурения лунок и свай.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motobur1.jpg'
  },
  {
    id: 'trimmer',
    name: 'Мотокоса Champion',
    price: 1300,
    deposit: 3000,
    description: 'Бензиновый триммер для покоса травы, кустарников и участков средней сложности.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motokosa1.jpg'
  }
];

const rentalState = new Map();

// Команда /start или возвращение в главное меню
const sendMainMenu = async (ctx) => {
  const welcome = `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Выберите инструмент для аренды:`;

  const buttons = tools.map(tool => [
    Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)
  ]);

  await ctx.replyWithPhoto(
    { url: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png' },
    {
      caption: welcome,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons)
    }
  );
};

bot.start(sendMainMenu);

// Обработка кнопок инструментов
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*\n\n${tool.description}\n\n💰 *Цена:* ${tool.price} ₽ / сутки\n🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)],
          [Markup.button.callback('🏠 Вернуться в меню', 'back_to_menu')]
        ]
      }
    });
  });

  bot.action(`rent_${tool.id}`, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = ctx.chat.id;
    rentalState.set(chatId, { tool });
    await ctx.reply('👤 Введите ваше имя:', Markup.keyboard([['🏠 Вернуться в меню']]).oneTime().resize());
  });
});

// Возврат в главное меню
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await sendMainMenu(ctx);
});

const isValidPhone = (text) => /^\d{10,15}$/.test(text);
const isValidDate = (text) => /^\d{2}\.\d{2}\.\d{4}$/.test(text);

bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = rentalState.get(chatId);
  const input = ctx.message.text.trim();

  if (input === '🏠 Вернуться в меню') {
    rentalState.delete(chatId);
    return sendMainMenu(ctx);
  }

  if (!state) return;

  if (!state.name) {
    state.name = input;
    await ctx.reply('📞 Введите ваш номер телефона (только цифры):');
  } else if (!state.phone) {
    if (!isValidPhone(input)) {
      await ctx.reply('⚠️ Номер должен содержать только цифры (10–15 цифр). Попробуйте снова:');
      return;
    }
    state.phone = input;
    await ctx.reply('📅 Введите дату начала аренды (в формате ДД.ММ.ГГГГ):');
  } else if (!state.startDate) {
    if (!isValidDate(input)) {
      await ctx.reply('❌ Неверный формат даты. Введите дату начала в формате ДД.ММ.ГГГГ:');
      return;
    }
    state.startDate = input;
    await ctx.reply('📅 Введите дату конца аренды (в формате ДД.ММ.ГГГГ):');
  } else if (!state.endDate) {
    if (!isValidDate(input)) {
      await ctx.reply('❌ Неверный формат даты. Введите дату конца в формате ДД.ММ.ГГГГ:');
      return;
    }
    state.endDate = input;

    await ctx.reply(`📝 Проверьте данные:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 Начало: ${state.startDate}
📅 Конец: ${state.endDate}

Подтвердить заказ? (напишите "да" или "нет")`, Markup.keyboard([['🏠 Вернуться в меню']]).resize());

    state.awaitingConfirmation = true;
  } else if (state.awaitingConfirmation) {
    if (input.toLowerCase() === 'да') {
      const msg = `📥 Заявка:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 Дата начала: ${state.startDate}
📅 Дата конца: ${state.endDate}`;

      await ctx.telegram.sendMessage(ownerId, msg);
      await ctx.reply('✅ Заявка отправлена! Спасибо, что выбрали нас. Отличного вам настроения! 🌞', Markup.removeKeyboard());
      rentalState.delete(chatId);
    } else {
      await ctx.reply('❌ Заявка отменена.', Markup.removeKeyboard());
      rentalState.delete(chatId);
    }
  }
});

bot.launch();
console.log('🤖 Бот запущен');
