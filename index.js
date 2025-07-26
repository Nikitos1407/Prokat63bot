require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;
bot.use(session());

// 🧰 Инструменты
const tools = [
  {
    id: 'perforator',
    name: 'Перфоратор Makita РК2470',
    price: 1400,
    deposit: 5000,
    description: 'Мощный перфоратор для бурения бетона и кирпича.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/molotok-original1.jpg'
  },
  {
    id: 'vibro',
    name: 'Виброплита Champion PC9045F',
    price: 1800,
    deposit: 5000,
    description: 'Для уплотнения грунта, плитки, щебня.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/vibroplate-original1.jpg'
  },
  {
    id: 'mixer',
    name: 'Строительный миксер Ресанта СМ-1600Э-2',
    price: 850,
    deposit: 3000,
    description: 'Инструмент для замеса смесей. Удобная двухскоростная модель.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/mikser-original1.jpg'
  },
  {
    id: 'auger',
    name: 'Мотобур Huter GGD-300 с комплектом',
    price: 1300,
    deposit: 5000,
    description: 'С шнеками (100–250 мм), удлинитель 1000 мм. Для бурения и заборов.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motobur1.jpg'
  },
  {
    id: 'trimmer',
    name: 'Мотокоса Champion',
    price: 1300,
    deposit: 3000,
    description: 'Бензиновый триммер для покоса травы и кустарников.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motokosa1.jpg'
  }
];

const userStates = new Map();

// Главное меню
const mainMenu = Markup.keyboard([
  ['📋 Список инструментов'],
  ['📦 Как арендовать', '📞 Связаться с нами'],
  ['💬 Отзывы', '⚙️ О нас']
]).resize();

bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png',
    {
      caption: `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!\n\n📍 *Новокуйбышевск*\n🕘 9:00–21:00\n💵 Наличные / перевод\n\nНажмите кнопку ниже или /menu для начала`,
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

bot.command('menu', (ctx) => ctx.reply('📲 Главное меню:', mainMenu));

// 📋 Список инструментов
bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(tool => [Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)]);
  await ctx.reply('🔧 Выберите инструмент для аренды:', Markup.inlineKeyboard(buttons));
});

// Показ информации об инструменте
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*\n\n${tool.description}\n\n💰 *Цена:* ${tool.price} ₽/сутки\n🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)],
        [Markup.button.callback('🏠 Меню', 'back_to_menu')]
      ])
    });
  });

  // Начать аренду
  bot.action(`rent_${tool.id}`, async (ctx) => {
    await ctx.answerCbQuery();
    userStates.set(ctx.chat.id, { step: 'name', tool });
    await ctx.reply('👤 Введите ваше имя:', Markup.keyboard([['🏠 Меню']]).resize());
  });
});

// Обработка шагов формы
bot.on('text', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  const text = ctx.message.text.trim();

  if (!state || text === '🏠 Меню') {
    userStates.delete(ctx.chat.id);
    return ctx.reply('📲 Главное меню:', mainMenu);
  }

  switch (state.step) {
    case 'name':
      state.name = text;
      state.step = 'phone';
      await ctx.reply('📞 Введите номер телефона (только цифры):');
      break;
    case 'phone':
      if (!/^\d{7,15}$/.test(text)) {
        return ctx.reply('❌ Пожалуйста, введите корректный номер телефона (только цифры):');
      }
      state.phone = text;
      state.step = 'startDate';
      await ctx.reply('📅 Введите дату начала аренды (ДД.ММ.ГГГГ):');
      break;
    case 'startDate':
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
        return ctx.reply('❌ Неверный формат. Введите дату в формате ДД.ММ.ГГГГ:');
      }
      state.startDate = text;
      state.step = 'endDate';
      await ctx.reply('📅 Введите дату окончания аренды (ДД.ММ.ГГГГ):');
      break;
    case 'endDate':
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(text)) {
        return ctx.reply('❌ Неверный формат. Введите дату в формате ДД.ММ.ГГГГ:');
      }
      state.endDate = text;
      state.step = 'confirm';
      await ctx.reply(
        `📝 Подтвердите заявку:\n\n🔧 *${state.tool.name}*\n👤 ${state.name}\n📞 ${state.phone}\n📅 С ${state.startDate} по ${state.endDate}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Подтвердить', 'confirm')],
            [Markup.button.callback('❌ Отмена', 'cancel')]
          ])
        }
      );
      break;
  }
});

// Подтверждение
bot.action('confirm', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  if (!state) return;

  const message = `📥 Новая заявка:\n\n🔧 ${state.tool.name}\n👤 ${state.name}\n📞 ${state.phone}\n📅 ${state.startDate} — ${state.endDate}`;
  await ctx.telegram.sendMessage(ownerId, message);
  await ctx.editMessageText('✅ Заявка отправлена! Спасибо за обращение. Отличного вам настроения! 🌞');
  userStates.delete(ctx.chat.id);
});

// Отмена
bot.action('cancel', async (ctx) => {
  userStates.delete(ctx.chat.id);
  await ctx.editMessageText('❌ Заявка отменена. Чтобы начать заново — нажмите /menu');
});

// Обработка меню
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📲 Главное меню:', mainMenu);
});

// Остальные разделы
bot.hears('📦 Как арендовать', (ctx) =>
  ctx.reply('1. Выберите инструмент\n2. Нажмите "Арендовать"\n3. Введите имя, телефон и даты\n4. Подтвердите заявку'));

bot.hears('📞 Связаться с нами', (ctx) =>
  ctx.reply('📲 Telegram: @ProkatinstrumentaNSK\n📍 Новокуйбышевск\n🕘 с 9:00 до 21:00'));

bot.hears('💬 Отзывы', (ctx) =>
  ctx.reply('⭐️ Скоро появятся реальные отзывы наших клиентов!'));

bot.hears('⚙️ О нас', (ctx) =>
  ctx.reply('🔧 Прокат инструмента в Новокуйбышевске — быстро, просто и надёжно.'));

bot.launch();
console.log('🤖 Бот запущен');
