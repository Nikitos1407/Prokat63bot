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

bot.start(async (ctx) => {
  const welcomeMessage = `👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Выберите инструмент для аренды:`;

  const buttons = tools.map(tool => [Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)]);

  await ctx.replyWithPhoto(
    { url: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png' }, // Замените на ваш логотип или фото
    {
      caption: welcomeMessage,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard(buttons)
    }
  );
});

tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.replyWithPhoto({ url: tool.photo }, {
      caption: `🛠 *${tool.name}*

${tool.description}

💰 *Цена:* ${tool.price} ₽ / сутки
🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)]
      ])
    });
  });

  bot.action(`rent_${tool.id}`, async (ctx) => {
    ctx.reply(`📩 Отправьте заявку в следующем формате:

Имя:
Телефон:
Инструмент: ${tool.name}
Дата начала:
Комментарий (если нужно):`);
  });
});

bot.on('text', async (ctx) => {
  if (ctx.message.text.toLowerCase().includes('телефон')) {
    await ctx.telegram.sendMessage(ownerId, `📥 Заявка:

${ctx.message.text}`);
    await ctx.reply('✅ Заявка отправлена! Мы скоро свяжемся с вами.');
  }
});

bot.launch();
console.log('🤖 Бот запущен');
