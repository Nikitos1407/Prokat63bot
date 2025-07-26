
require('dotenv').config();
const express = require('express');
const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;
bot.use(session());

const userStates = new Map();

const tools = [
  {
    id: 'perforator',
    name: 'Перфоратор Makita РК2470',
    price: 1400,
    deposit: 5000,
    description: 'Мощный перфоратор для бурения бетона и кирпича.',
    photo: 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/molotok-original1.jpg'
  }
];

const mainMenu = Markup.keyboard([
  ['📋 Список инструментов'],
  ['📦 Как арендовать', '📍 Где забрать?'],
  ['📞 Позвонить', '💬 Отзывы', '⚙️ О нас']
]).resize();

function isValidDate(dateStr) {
  return /^\d{2}\.\d{2}\.\d{4}$/.test(dateStr);
}

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

bot.command('menu', (ctx) => ctx.reply('📲 Главное меню:', mainMenu));

bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(tool => [Markup.button.callback(`${tool.name} — ${tool.price}₽`, tool.id)]);
  await ctx.reply('Выберите инструмент для аренды:', Markup.inlineKeyboard(buttons));
});

tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption: `🛠 *${tool.name}*

${tool.description}

💰 *Цена:* ${tool.price} ₽ / сутки
🔐 *Залог:* ${tool.deposit} ₽`,
      parse_mode: 'Markdown',
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('👉 Арендовать', `rent_${tool.id}`)],
        [Markup.button.callback('🏠 Меню', 'go_menu')]
      ])
    });
  });

  bot.action(`rent_${tool.id}`, async (ctx) => {
    await ctx.answerCbQuery();
    userStates.set(ctx.chat.id, { step: 'name', tool });
    await ctx.reply('📍 Шаг 1 из 4 — Введите ваше имя:');
  });
});

bot.on('text', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  if (!state) return;

  const text = ctx.message.text.trim();

  if (state.step === 'name') {
    state.name = text;
    state.step = 'phone';
    await ctx.reply('📍 Шаг 2 из 4 — Введите номер телефона (только цифры):');
  } else if (state.step === 'phone') {
    if (!/^\d{7,15}$/.test(text)) {
      return ctx.reply('❌ Введите корректный номер (только цифры):');
    }
    state.phone = text;
    state.step = 'startDate';
    await ctx.reply('📍 Шаг 3 из 4 — Введите дату начала аренды (ДД.ММ.ГГГГ):');
  } else if (state.step === 'startDate') {
    if (!isValidDate(text)) {
      return ctx.reply('❌ Введите дату в формате ДД.ММ.ГГГГ:');
    }
    state.startDate = text;
    state.step = 'endDate';
    await ctx.reply('📍 Шаг 4 из 4 — Введите дату окончания аренды (ДД.ММ.ГГГГ):');
  } else if (state.step === 'endDate') {
    if (!isValidDate(text)) {
      return ctx.reply('❌ Введите дату в формате ДД.ММ.ГГГГ:');
    }

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
        [Markup.button.callback('✅ Подтвердить', 'confirm')],
        [Markup.button.callback('❌ Отмена', 'cancel')],
        [Markup.button.callback('🏠 Меню', 'go_menu')]
      ])
    );
  }
});

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

bot.action('go_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📲 Главное меню:', mainMenu);
});

const app = express();
app.get('/', (req, res) => {
  res.send('🤖 Бот работает!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер Express запущен на порту ${PORT}`);
});

bot.launch().then(() => {
  console.log('🤖 Бот успешно запущен через polling');
});
