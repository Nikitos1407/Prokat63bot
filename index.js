require('dotenv').config();
const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;
bot.use(session());

// 📦 Состояния пользователя
const userStates = new Map();

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

// 🔘 Главное меню
const mainMenu = Markup.keyboard([
  ['📋 Список инструментов'],
  ['📦 Как арендовать', '📞 Связаться с нами'],
  ['💬 Отзывы', '⚙️ О нас']
]).resize();

// ▶ /start
bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png',
    {
      caption: `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Нажмите кнопку ниже или /menu для начала.`,
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// ▶ /menu
bot.command('menu', (ctx) => ctx.reply('📲 Главное меню:', mainMenu));

// 📋 Список инструментов
bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(tool => [Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)]);
  await ctx.reply('Выберите инструмент для аренды:', Markup.inlineKeyboard(buttons));
});

// 🔧 Кнопка инструмента → показать инфо
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*\n\n${tool.description}\n\n💰 *Цена:* ${tool.price} ₽ / сутки\n🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)]
      ])
    });
  });

  // 👉 Арендовать — шаг 1
  bot.action(`rent_${tool.id}`, async (ctx) => {
    await ctx.answerCbQuery();
    userStates.set(ctx.chat.id, { step: 'name', tool });
    await ctx.reply('👤 Введите ваше имя:');
  });
});

// 📝 Шаги аренды
bot.on('text', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  if (!state) return;

  const text = ctx.message.text.trim();

  if (state.step === 'name') {
    state.name = text;
    state.step = 'phone';
    await ctx.reply('📞 Введите номер телефона (только цифры):');
  } else if (state.step === 'phone') {
    if (!/^\d{7,15}$/.test(text)) {
      return ctx.reply('❌ Введите корректный номер (только цифры):');
    }
    state.phone = text;
    state.step = 'startDate';
    await ctx.reply('📅 Введите дату начала аренды (в формате ДД.ММ.ГГГГ):');
  } else if (state.step === 'startDate') {
    state.startDate = text;
    state.step = 'endDate';
    await ctx.reply('📅 Введите дату окончания аренды (в формате ДД.ММ.ГГГГ):');
  } else if (state.step === 'endDate') {
    state.endDate = text;
    state.step = 'confirm';

    await ctx.reply(
      `📝 Проверьте заявку:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 С: ${state.startDate}
📅 По: ${state.endDate}

Подтвердите заказ?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Подтвердить', 'confirm'), Markup.button.callback('❌ Отмена', 'cancel')]
      ])
    );
  }
});

// ✅ Подтверждение
bot.action('confirm', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  if (!state) return;

  const message = `📥 Новая заявка:

🔧 Инструмент: ${state.tool.name}
👤 Имя: ${state.name}
📞 Телефон: ${state.phone}
📅 С: ${state.startDate}
📅 По: ${state.endDate}`;

  await ctx.telegram.sendMessage(ownerId, message);
  await ctx.editMessageText('✅ Заявка отправлена! Спасибо, что выбрали нас. Отличного вам дня ☀️');
  userStates.delete(ctx.chat.id);
});

bot.action('cancel', async (ctx) => {
  userStates.delete(ctx.chat.id);
  await ctx.editMessageText('❌ Заявка отменена. Чтобы начать заново — нажмите /menu');
});

// 📦 Как арендовать
bot.hears('📦 Как арендовать', (ctx) => {
  ctx.reply(`1. Выберите инструмент\n2. Нажмите "Арендовать"\n3. Заполните данные\n4. Мы свяжемся с вами!`);
});

// 📞 Связаться с нами
bot.hears('📞 Связаться с нами', (ctx) => {
  ctx.reply(`📲 Telegram: @ProkatinstrumentaNSK\n📍 Гараж в Новокуйбышевске\n🕘 с 9:00 до 21:00`);
});

// 💬 Отзывы
bot.hears('💬 Отзывы', (ctx) => {
  ctx.reply('⭐️ Отзывы от довольных клиентов скоро появятся!');
});

// ⚙️ О нас
bot.hears('⚙️ О нас', (ctx) => {
  ctx.reply('🔧 Прокат инструмента в Новокуйбышевске. Всё надёжно, быстро и просто!');
});

// ▶ Запуск
bot.launch();
console.log('🤖 Бот запущен');
