require('dotenv').config();
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const { enter, leave } = Scenes.Stage;
const { Calendar } = require('telegraf-calendar-telegram'); // npm install telegraf-calendar-telegram

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;

// 📅 Календарь
const calendarStart = new Calendar(bot, {
  startWeekDay: 1,
  weekDayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ],
  minDate: new Date(),
  dateFormat: 'DD.MM.YYYY'
});

const calendarEnd = new Calendar(bot, {
  startWeekDay: 1,
  weekDayNames: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ],
  minDate: new Date(),
  dateFormat: 'DD.MM.YYYY'
});

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

// 👉 Хранилище сессии аренды
const rentalState = new Map();

bot.use(session());

// 👋 /start
bot.start(async (ctx) => {
  const welcome = `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!\n
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
});

// 🔧 Показать инфо об инструменте и предложить аренду
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*\n\n${tool.description}\n\n💰 *Цена:* ${tool.price} ₽ / сутки\n🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)]
        ]
      }
    });
  });

  bot.action(`rent_${tool.id}`, async (ctx) => {
    await ctx.answerCbQuery();
    const chatId = ctx.chat.id;
    rentalState.set(chatId, { tool }); // сохраняем выбранный инструмент
    await ctx.reply('👤 Введите ваше имя:');
  });
});

// 📝 Последовательный приём данных
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = rentalState.get(chatId);
  if (!state) return;

  if (!state.name) {
    state.name = ctx.message.text;
    await ctx.reply('📞 Введите ваш номер телефона:');
  } else if (!state.phone) {
    state.phone = ctx.message.text;
    calendarStart.setMinDate(new Date());
    calendarStart.showCalendar(ctx);
  } else if (state.awaitingConfirmation) {
    if (ctx.message.text.toLowerCase() === 'да') {
      const msg = `📥 Заявка:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 Дата начала: ${state.startDate}
📅 Дата конца: ${state.endDate}`;

      await ctx.telegram.sendMessage(ownerId, msg);
      await ctx.reply('✅ Заявка отправлена! Спасибо, что выбрали нас. Отличного вам настроения! 🌞');
      rentalState.delete(chatId);
    } else {
      await ctx.reply('❌ Заявка отменена.');
      rentalState.delete(chatId);
    }
  }
});

// 📆 Получение даты начала
calendarStart.setDateListener(async (ctx, date) => {
  const chatId = ctx.chat.id;
  const state = rentalState.get(chatId);
  if (!state) return;

  state.startDate = date;
  calendarEnd.setMinDate(new Date(date));
  calendarEnd.showCalendar(ctx);
});

// 📆 Получение даты конца
calendarEnd.setDateListener(async (ctx, date) => {
  const chatId = ctx.chat.id;
  const state = rentalState.get(chatId);
  if (!state) return;

  state.endDate = date;

  await ctx.reply(`📝 Проверьте данные:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 Начало: ${state.startDate}
📅 Конец: ${state.endDate}

Подтвердить заказ? (напишите "да" или "нет")`);

  state.awaitingConfirmation = true;
});

// Запускаем бота
bot.launch();
console.log('🤖 Бот запущен');
