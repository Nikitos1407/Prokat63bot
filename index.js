require('dotenv').config();
const express = require('express');
const { Telegraf, Markup, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ownerId = process.env.OWNER_ID;
bot.use(session());

const userStates = new Map();
const userHistory = new Map();

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
    description: 'С шнеками (100–250 мм), удлинитель 1000 мм. Идеально для бурения.',
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

// 🗂 Главное меню
const mainMenu = Markup.keyboard([
  ['📋 Список инструментов'],
  ['📦 Как арендовать', '📍 Где забрать?'],
  ['📞 Позвонить', '💬 Отзывы', '⚙️ О нас']
]).resize();

// Вспомогательные функции
function isValidDate(d) { return /^\d{2}\.\d{2}\.\d{4}$/.test(d); }
function parseDate(d) {
  const [day, month, year] = d.split('.').map(Number);
  return new Date(year, month - 1, day);
}
function getRentalDays(start, end) {
  const ms = 24*60*60*1000;
  return Math.max(1, Math.round((end - start) / ms));
}

// ▶ /start
bot.start(async (ctx) => {
  await ctx.replyWithPhoto(
    'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png',
    {
      caption:
`👋 Добро пожаловать в *ПРОКАТ Инструментов 63*!

📍 *Гаражный бокс (Новокуйбышевск)*
🕘 Работаем с 9:00 до 21:00
💵 Оплата: наличные / перевод

Нажмите кнопку ниже или /menu для начала.`,
      parse_mode: 'Markdown',
      reply_markup: mainMenu
    }
  );
});

// ▶ /menu
bot.command('menu', (ctx) => ctx.reply('📲 Главное меню:', mainMenu));

// 📋 Список инструментов
bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(t =>
    [Markup.button.callback(`${t.name} — ${t.price}₽`, t.id)]
  );
  await ctx.reply('Выберите инструмент для аренды:', Markup.inlineKeyboard(buttons));
});

// Карточки инструментов & начало формы
tools.forEach(tool => {
  bot.action(tool.id, async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.replyWithPhoto(tool.photo, {
      caption:
`🛠 *${tool.name}*

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

  bot.action(`repeat_${tool.id}`, async (ctx) => {
    // Повтор аренды
    const last = (userHistory.get(ctx.chat.id) || []).slice(-1)[0] || {};
    userStates.set(ctx.chat.id, {
      step: 'startDate',
      tool,
      name: last.name || '',
      phone: last.phone || ''
    });
    await ctx.reply('📍 Повтор аренды — введите дату начала (ДД.ММ.ГГГГ):');
  });
});

// Обработка формы аренды
bot.on('text', async (ctx) => {
  const state = userStates.get(ctx.chat.id);
  if (!state) return;
  const txt = ctx.message.text.trim();

  if (state.step === 'name') {
    state.name = txt;
    state.step = 'phone';
    return ctx.reply('📍 Шаг 2 из 4 — Введите номер телефона (только цифры):');
  }
  if (state.step === 'phone') {
    if (!/^\d{7,15}$/.test(txt)) {
      return ctx.reply('❌ Неверный формат. Введите только цифры:');
    }
    state.phone = txt;
    state.step = 'startDate';
    return ctx.reply('📍 Шаг 3 из 4 — Введите дату начала аренды (ДД.ММ.ГГГГ):');
  }
  if (state.step === 'startDate') {
    if (!isValidDate(txt)) {
      return ctx.reply('❌ Неверный формат. Введите ДД.ММ.ГГГГ:');
    }
    state.startDate = txt;
    state.step = 'endDate';
    return ctx.reply('📍 Шаг 4 из 4 — Введите дату окончания аренды (ДД.ММ.ГГГГ):');
  }
  if (state.step === 'endDate') {
    if (!isValidDate(txt)) {
      return ctx.reply('❌ Неверный формат. Введите ДД.ММ.ГГГГ:');
    }
    state.endDate = txt;
    // Расчёт
    const start = parseDate(state.startDate);
    const end   = parseDate(state.endDate);
    const days  = getRentalDays(start, end);
    const total = days * state.tool.price;
    state.days  = days;
    state.total = total;
    state.step  = 'confirm';

    return ctx.reply(
      `🔁 Проверьте данные:\n\n` +
      `👤 Имя: ${state.name}\n` +
      `📞 Телефон: ${state.phone}\n` +
      `📅 С: ${state.startDate}\n` +
      `📅 По: ${state.endDate} (${days} дн.)\n\n` +
      `💰 Итого: ${state.tool.price}₽ × ${days} = ${total}₽\n` +
      `🔐 Залог: ${state.tool.deposit}₽\n\n` +
      `Подтвердить заказ?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Подтвердить', 'confirm')],
        [Markup.button.callback('❌ Отмена',   'cancel')],
        [Markup.button.callback('🏠 Меню',     'go_menu')]
      ])
    );
  }
});

// Подтверждение
bot.action('confirm', async (ctx) => {
  const s = userStates.get(ctx.chat.id);
  if (!s) return;

  // Отправка владельцу
  await ctx.telegram.sendMessage(ownerId,
    `📥 Новая заявка:\n\n` +
    `🔧 ${s.tool.name}\n` +
    `👤 ${s.name}\n` +
    `📞 ${s.phone}\n` +
    `📅 ${s.startDate} → ${s.endDate} (${s.days} дн.)\n` +
    `💰 Аренда: ${s.total}₽ + Залог: ${s.tool.deposit}₽`
  );

  // Ответ юзеру + кнопка повторить
  await ctx.editMessageText('✅ Заявка отправлена! Спасибо за обращение.', {
    reply_markup: Markup.inlineKeyboard([
      [Markup.button.callback('🔁 Повторить этот инструмент', `repeat_${s.tool.id}`)]
    ])
  });

  // Сохраняем в историю
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
bot.action('cancel', async (ctx) => {
  userStates.delete(ctx.chat.id);
  await ctx.editMessageText('❌ Заявка отменена. Введите /menu, чтобы начать заново.');
});

// Главное меню из карточки
bot.action('go_menu', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('📲 Главное меню:', mainMenu);
});

// История аренд
bot.command('history', (ctx) => {
  const hist = userHistory.get(ctx.chat.id) || [];
  if (!hist.length) return ctx.reply('📂 У вас пока нет аренд.');
  const out = hist.map((h,i)=>
    `#${i+1} ${h.tool}\n` +
    `📅 ${h.startDate} → ${h.endDate}\n` +
    `💰 ${h.total}₽`
  ).join('\n\n');
  ctx.reply(`📜 Ваша история:\n\n${out}`);
});

// FAQ-кнопки
bot.hears('📦 Как арендовать', (ctx) => {
  ctx.reply('1️⃣ Выберите инструмент\n2️⃣ Нажмите "Арендовать"\n3️⃣ Заполните форму\n4️⃣ Мы свяжемся с вами');
});
bot.hears('📍 Где забрать?', async (ctx) => {
  await ctx.replyWithLocation(53.101325, 49.965541);
  await ctx.reply(
    `📍 Гаражный бокс, Новокуйбышевск\n\n` +
    `[Яндекс.Карты](https://yandex.ru/maps/?ll=49.965541%2C53.101325&z=18)\n` +
    `[2ГИС](https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.966093%2C53.100959%2F18.68)`,
    { parse_mode: 'Markdown' }
  );
});
bot.hears('📞 Позвонить', (ctx) => {
  ctx.reply('📞 Контакты:', Markup.inlineKeyboard([
    [Markup.button.url('📞 Позвонить', 'tel:+79991234567')],
    [Markup.button.url('💬 Telegram', 'https://t.me/ProkatinstrumentaNSK')]
  ]));
});
bot.hears('💬 Отзывы', (ctx) => ctx.reply('⭐️ Отзывы скоро здесь появятся!'));
bot.hears('⚙️ О нас', (ctx) => ctx.reply('🔧 Прокат Инструментов 63 — быстро и надёжно!'));

// Лонг-пуллинг
bot.launch().then(() => console.log('🤖 Бот запущен через polling'))
   .catch(err => console.error('❌ Ошибка запуска бота:', err));
