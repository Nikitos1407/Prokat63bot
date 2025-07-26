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

// Память для шагов
const userSteps = {};

bot.start(async (ctx) => {
  const welcome = `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!\n
📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Выберите инструмент для аренды:`;

  const buttons = tools.map(tool => [
    Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)
  ]);

  await ctx.sendPhoto(
    'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png',
    {
      caption: welcome,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    }
  );
});

tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.sendPhoto(tool.photo, {
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
    userSteps[ctx.from.id] = {
      step: 'name',
      tool: tool.name,
      data: {}
    };
    await ctx.reply('Введите ваше *имя*:', { parse_mode: 'Markdown' });
  });
});

bot.on('text', async (ctx) => {
  const id = ctx.from.id;
  const state = userSteps[id];

  if (!state) return;

  const text = ctx.message.text;

  if (state.step === 'name') {
    state.data.name = text;
    state.step = 'phone';
    await ctx.reply('Введите *номер телефона*:', { parse_mode: 'Markdown' });
  } else if (state.step === 'phone') {
    state.data.phone = text;
    state.step = 'start';
    await ctx.reply('Введите *дату начала аренды* (например, 27.07.2025):', { parse_mode: 'Markdown' });
  } else if (state.step === 'start') {
    state.data.start = text;
    state.step = 'end';
    await ctx.reply('Введите *дату конца аренды*:', { parse_mode: 'Markdown' });
  } else if (state.step === 'end') {
    state.data.end = text;
    state.step = 'confirm';

    const summary = `🔔 Подтвердите заявку:\n\n` +
      `🛠 Инструмент: *${state.tool}*\n` +
      `👤 Имя: *${state.data.name}*\n` +
      `📞 Телефон: *${state.data.phone}*\n` +
      `📅 С: *${state.data.start}* по *${state.data.end}*`;

    await ctx.reply(summary, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('✅ Подтвердить', `confirm_${id}`)],
          [Markup.button.callback('❌ Отмена', `cancel_${id}`)]
        ]
      }
    });
  }
});

bot.action(/^confirm_(\d+)$/, async (ctx) => {
  const id = ctx.match[1];
  const state = userSteps[id];
  if (!state) return;

  const message = `📥 Новая заявка:\n\n` +
    `🛠 Инструмент: ${state.tool}\n` +
    `👤 Имя: ${state.data.name}\n` +
    `📞 Телефон: ${state.data.phone}\n` +
    `📅 Аренда: с ${state.data.start} по ${state.data.end}`;

  await ctx.telegram.sendMessage(ownerId, message);
  await ctx.reply('✅ Заявка отправлена! Спасибо, что выбрали нас. Отличного вам дня!');

  delete userSteps[id];
});

bot.action(/^cancel_(\d+)$/, async (ctx) => {
  const id = ctx.match[1];
  delete userSteps[id];
  await ctx.reply('❌ Заявка отменена.');
});

bot.launch();
console.log('🤖 Бот запущен');
