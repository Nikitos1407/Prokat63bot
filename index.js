require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { google } = require('googleapis');
const path = require('path');

// --- Логотип ---
const LOGO = 'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/logo.png';

// --- Google Sheets настройка ---
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_KEY_PATH || path.join(__dirname, 'google-key.json'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/calendar'
  ],
});
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const sheetName = 'Заявки';

// --- Добавление заказа в Google Sheets ---
async function appendOrderToSheet(data, tool) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // Считаем, сколько строк уже есть на листе "Заявки"
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Заявки!A:A',
  });
  const rowCount = res.data.values ? res.data.values.length : 0;
  const nextId = `AR-${rowCount}`;

  // Формируем values строго под твои нужные столбцы
  const values = [[
    nextId,            // A: ID заказа
    data.name,         // B: Имя клиента
    data.phone,        // C: Телефон
    '', '', '', '', '',// D-H: пропуск
    tool.name,         // I: Инструмент
    data.dateStart,    // J: Дата начала
    data.dateEnd,      // K: Дата конца
    '',                // L: Стоимость в сутки
    tool.deposit,      // M: Залог
    data.days,         // N: Количество дней
    data.sum           // O: Сумма
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Заявки!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

// --- Добавление события в Google Календарь ---
async function addOrderToCalendar(order, tool) {
  const client = await auth.getClient();
  const calendar = google.calendar({ version: 'v3', auth: client });

  // Форматируем даты в YYYY-MM-DD
  function formatDate(str) {
    const [d, m, y] = str.split('.');
    return `${y}-${m}-${d}`;
  }

  // Для корректного отображения события "до" включительно:
  const [d, m, y] = order.dateEnd.split('.');
  const endDateObj = new Date(y, m - 1, +d + 1);
  const endDateStr = endDateObj.toISOString().slice(0, 10);

  const event = {
    summary: `Аренда: ${tool.name}`,
    description: `Клиент: ${order.name}\nТелефон: ${order.phone}\nПериод: ${order.dateStart} — ${order.dateEnd}`,
    start: { date: formatDate(order.dateStart) },
    end: { date: endDateStr }, // Google Calendar НЕ включает последний день, поэтому +1
  };

  try {
    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      resource: event,
    });
    console.log('Событие добавлено в календарь!');
  } catch (e) {
    console.error('Ошибка при добавлении в календарь:', e.message);
  }
}
// --- Инструменты ---
const tools = [
  {
    id: 'otbmolot',
    name: 'Отбойный молоток Makita HM 1213 C',
    desc: 'Мощный отбойник для демонтажа.\nКомплект: Отбойный молоток — 1 шт, Долото пикообразное (L-300мм) — 1 шт, Зубило лопаточное (75х400мм) — 1 шт, Кейс — 1 шт.',
    price: 1400, // для совместимости, но теперь используем pricing
    deposit: 5000,
    images: ['https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/molotok-original1.jpg'],
    pricing: [
      { from: 1, to: 2, pricePerDay: 1400 },
      { from: 3, to: 6, pricePerDay: 1200 },   // за 3 дня (скидка)
      { from: 7, to: 30, pricePerDay: 1200 }    // за неделю (ещё выгоднее)
    ]
  },
  {
    id: 'vibro',
    name: 'Виброплита Champion PC9045F',
    desc: 'Для уплотнения грунта, плитки, щебня.',
    price: 1800,
    deposit: 5000,
    images: ['https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/vibro1.jpg'],
    pricing: [
      { from: 1, to: 2, pricePerDay: 1800 },
      { from: 3, to: 6, pricePerDay: 1700 },
      { from: 7, to: 30, pricePerDay: 1600 }
    ]
  },
  {
    id: 'motobur',
    name: 'Мотобур Huter GGD-300 с комплектом',
    desc: 'С шнеками (100–250 мм), удлинитель 1000 мм. Идеально для бурения.\nКомплект: Мотобур — 1 шт, Шнек (100/150/200/250 мм) — 1 шт на выбор, Удлинитель — 1 шт.',
    price: 1300,
    deposit: 5000,
    images: ['https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motobur1.jpg'],
    pricing: [
      { from: 1, to: 2, pricePerDay: 1300 },
      { from: 3, to: 6, pricePerDay: 1200 },
      { from: 7, to: 30, pricePerDay: 1000 }
    ]
  },
  {
    id: 'trimmer',
    name: 'Мотокоса Champion',
    desc: 'Бензиновый триммер для покоса травы и кустарников.\nКомплект: Триммер — 1 шт, (Диск или катушка) — 1 шт на выбор.',
    price: 1300,
    deposit: 3000,
    images: ['https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/motokosa1.jpg'],
    pricing: [
      { from: 1, to: 2, pricePerDay: 1300 },
      { from: 3, to: 6, pricePerDay: 900 },
      { from: 7, to: 30, pricePerDay: 900 }
    ]
  },
  {
    id: 'mikser',
    name: 'Строительный миксер Ресанта СМ-1600Э-2 75/20/1',
    desc: 'Надёжный миксер для растворов.\nТип патрона: М14, резьбовое соединение.\nКомплект: Насадка — 1 шт, Ключ — 2 шт.',
    price: 850,
    deposit: 2000,
    images: ['https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/mikser-original1.jpg'],
    pricing: [
      { from: 1, to: 2, pricePerDay: 850 },
      { from: 3, to: 6, pricePerDay: 700 },
      { from: 7, to: 30, pricePerDay: 700 }
    ]
  }
];

// --- Функция для расчёта суммы аренды с учетом тарифов инструмента ---
function calcToolPrice(toolId, daysCount) {
  const tool = tools.find(t => t.id === toolId);
  if (!tool || !tool.pricing) return null;
  // Ищем нужный диапазон
  const tariff = tool.pricing.find(t =>
    daysCount >= t.from && daysCount <= t.to
  );
  if (!tariff) return null;
  return daysCount * tariff.pricePerDay;
}

// --- Главное меню ---
const mainMenu = Markup.keyboard([
  ['📋 Список инструментов', '📦 Как арендовать'],
  ['📞 Связаться с нами', '📍 Где забрать?'],
  ['💬 Отзывы', '⚙️ О нас'],
]).resize();

// --- Telegraf bot ---
const bot = new Telegraf(process.env.BOT_TOKEN);
// --- Управление отзывами с оценкой ---
const reviewMode = {}; // { userId: { step, score } }
// --- Массив ссылок на скриншоты отзывов с Авито ---
const avitoScreens = [
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv1.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv2.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv3.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv4.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv5.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv6.jpg',
  'https://raw.githubusercontent.com/Nikitos1407/Prokat63bot/main/images/otzv7.jpg'
];
const avitoSliderState = {}; // <------ ОБЯЗАТЕЛЬНО!
async function sendAvitoScreen(ctx, index) {
  const total = avitoScreens.length;
  const url = avitoScreens[index];
  let caption = `Отзывы с Авито (${index + 1}/${total})\nhttps://www.avito.ru/user/YOUR_ID/feedbacks`;

  const buttons = [];
  if (index > 0) buttons.push(Markup.button.callback('← Назад', 'avito_prev'));
  if (index < total - 1) buttons.push(Markup.button.callback('Вперёд →', 'avito_next'));
  buttons.push(Markup.button.callback('🏠 Меню', 'menu'));

  // Удаляем старое фото если возможно (чисто, не критично если не получится)
  if (ctx.updateType === 'callback_query' && ctx.callbackQuery.message && ctx.callbackQuery.message.message_id) {
    try { await ctx.deleteMessage(); } catch(e){}
  }

  await ctx.replyWithPhoto({ url }, {
    caption,
    ...Markup.inlineKeyboard([buttons]),
  });
}
// Кнопка раздела отзывов
bot.hears('💬 Отзывы', async (ctx) => {
  await ctx.reply(
    'Выберите вариант:',
    Markup.inlineKeyboard([
      [Markup.button.callback('📝 Отзывы клиентов', 'show_reviews')],
      [Markup.button.callback('🖼️ Отзывы с Авито', 'avito_reviews')],
      [Markup.button.callback('Оставить отзыв', 'write_review')],
      [Markup.button.callback('🏠 Меню', 'menu')],
    ])
  );
});

// Кнопка "Отзывы с Авито"
bot.action('avito_reviews', async (ctx) => {
  avitoSliderState[ctx.from.id] = 0;
  const idx = 0;
  await ctx.replyWithPhoto(
    { url: avitoScreens[idx] },
    {
      caption: `Отзывы с Авито (${idx + 1}/${avitoScreens.length})`,
      ...Markup.inlineKeyboard([
        [
          ...(avitoScreens.length > 1 ? [Markup.button.callback('▶️ След', 'avito_next')] : []),
        ],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ])
    }
  );
  try { await ctx.answerCbQuery(); } catch(e) {}
});

// Кнопка "Следующий"
bot.action('avito_next', async (ctx) => {
  let idx = avitoSliderState[ctx.from.id] ?? 0;
  idx = (idx + 1) % avitoScreens.length;
  avitoSliderState[ctx.from.id] = idx;
  await ctx.replyWithPhoto(
    { url: avitoScreens[idx] },
    {
      caption: `Отзывы с Авито (${idx + 1}/${avitoScreens.length})`,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('◀️ Пред', 'avito_prev'),
          Markup.button.callback('▶️ След', 'avito_next'),
        ],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ])
    }
  );
  try { await ctx.answerCbQuery(); } catch(e) {}
});

// Кнопка "Предыдущий"
bot.action('avito_prev', async (ctx) => {
  let idx = avitoSliderState[ctx.from.id] ?? 0;
  idx = (idx - 1 + avitoScreens.length) % avitoScreens.length;
  avitoSliderState[ctx.from.id] = idx;
  await ctx.replyWithPhoto(
    { url: avitoScreens[idx] },
    {
      caption: `Отзывы с Авито (${idx + 1}/${avitoScreens.length})`,
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('◀️ Пред', 'avito_prev'),
          Markup.button.callback('▶️ След', 'avito_next'),
        ],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ])
    }
  );
  try { await ctx.answerCbQuery(); } catch(e) {}
});

// --- Показывать отзывы из Google Sheets + средняя оценка ---
bot.action('show_reviews', async (ctx) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Отзывы!A2:D',
    });
    const allReviews = res.data.values || [];
    if (allReviews.length === 0) {
      await ctx.reply('Пока отзывов нет. Будьте первым!');
    } else {
      // Средняя оценка
      const starsArr = allReviews.map(r => Number(r[3])).filter(Boolean);
      const avgScore = starsArr.length ? (starsArr.reduce((a, b) => a + b, 0) / starsArr.length).toFixed(1) : '—';
      const reviewsToShow = allReviews.slice(-5).reverse();
      let msg = `⭐️ Средняя оценка: <b>${avgScore}</b>/5\n\n📝 <b>Отзывы клиентов:</b>\n\n`;
      reviewsToShow.forEach(([username, review, date, score]) => {
        const stars = score ? '★'.repeat(Number(score)) + '☆'.repeat(5 - Number(score)) : '';
        msg += `${stars}\n<i>${username || 'Гость'}</i> (${date || '-'})\n“${review}”\n\n`;
      });
      await ctx.reply(msg, { parse_mode: 'HTML' });
    }
  } catch (e) {
    await ctx.reply('⚠️ Не удалось получить отзывы. Попробуйте позже.');
  }
  await ctx.answerCbQuery();
});

// --- Оставить отзыв: сначала оценка, потом текст ---
bot.action('write_review', async (ctx) => {
  reviewMode[ctx.from.id] = { step: 0 };
  await ctx.reply('Поставьте оценку нашему сервису от 1 до 5 (где 5 — отлично):',
    Markup.inlineKeyboard([
      [Markup.button.callback('⭐️ 1', 'rate_1'), Markup.button.callback('⭐️ 2', 'rate_2'), Markup.button.callback('⭐️ 3', 'rate_3'), Markup.button.callback('⭐️ 4', 'rate_4'), Markup.button.callback('⭐️ 5', 'rate_5')]
    ])
  );
  await ctx.answerCbQuery();
});

['1','2','3','4','5'].forEach(n => {
  bot.action(`rate_${n}`, async (ctx) => {
    reviewMode[ctx.from.id] = { step: 1, score: Number(n) };
    await ctx.reply('✍️ Теперь напишите свой отзыв текстом:');
    await ctx.answerCbQuery();
  });
});

// --- Принимаем текст — сохраняем отзыв с оценкой ---
bot.on('text', async (ctx, next) => {
  const state = reviewMode[ctx.from.id];
  if (state && state.step === 1) {
    const review = ctx.message.text;
    const username = ctx.from.username ? '@' + ctx.from.username : '';
    const date = new Date().toLocaleString('ru-RU');
    const score = state.score;
    try {
      await appendReviewToSheet({ username, review, date, score });
      await ctx.reply('🙏 Спасибо за отзыв и вашу оценку! Ваш отзыв скоро появится в ленте.');
    } catch (e) {
      await ctx.reply('⚠️ Не удалось сохранить отзыв. Попробуйте ещё раз.');
    }
    delete reviewMode[ctx.from.id];
    return;
  }
  return next();
});

// --- Функция для сохранения отзыва в Google Sheets ---
async function appendReviewToSheet({ username, review, date, score }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const values = [[username, review, date, score]];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Отзывы!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}
// /start
bot.start((ctx) => {
  ctx.replyWithPhoto(
    { url: LOGO },
    {
      caption: '👋 <b>Добро пожаловать в Prokat63!</b>\n\n' +
        '🔧 Тут вы найдёте всё, что нужно для ремонта, стройки и дачи — без лишних затрат.\n' +
        'Отбойник, триммер, мотобур, миксер, пила — просто выберите нужное, и мы всё подготовим!\n\n' +
        '🚀 Быстро, удобно и без головной боли:\n' +
        '• Самовывоз в Новокуйбышевске\n' +
        '• Надёжный и обслуженный инструмент\n' +
        '• Простой процесс аренды — прямо в боте\n\n' +
        '💬 Нажмите 🏠 Меню, чтобы начать — или выберите нужный инструмент!\n\n' +
        'Выберите действие:',
      parse_mode: 'HTML',
      ...mainMenu,
    }
  );
});

// /menu
bot.command('menu', (ctx) =>
  ctx.reply('Главное меню:', mainMenu)
);

// --- Список инструментов ---
bot.hears('📋 Список инструментов', async (ctx) => {
  const buttons = tools.map(tool => [
    Markup.button.callback(`${tool.name} — ${tool.price}₽`, `show_${tool.id}`)
  ]);
  await ctx.reply('Выберите инструмент:', Markup.inlineKeyboard(buttons));
});

// --- Детальная карточка ---
bot.action(/^show_(.+)$/, async (ctx) => {
  const toolId = ctx.match[1];
  const tool = tools.find(t => t.id === toolId);
  if (!tool) return ctx.reply('Инструмент не найден. Пожалуйста, выберите снова.');
  await ctx.replyWithPhoto(
    { url: tool.images[0] },
    {
      caption:
        `🔧 <b>${tool.name}</b>\n${tool.desc}\n\n` +
        `💰 <b>Цена:</b> ${tool.price}₽/сутки\n` +
        `💳 <b>Залог:</b> ${tool.deposit}₽\n`,
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📝 Арендовать', `rent_${tool.id}`)],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ]),
    }
  );
  await ctx.answerCbQuery();
});

// --- Пошаговая аренда ---
const RENT_STEPS = [
  'Введите ваше имя',
  'Введите номер телефона (только цифры, например 8XXXXXXXXXX)',
  'Введите дату начала аренды (ДД.ММ.ГГГГ)',
  'Введите дату окончания аренды (ДД.ММ.ГГГГ)',
];

const rentData = {}; // { userId: { step, data, toolId } }
// --- История заявок для Повтора ---
const rentHistory = {}; // { userId: [ заявки... ] }

// --- Анимация печати ---
function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
async function typingAndReply(ctx, text, extra = {}) {
  await ctx.replyWithChatAction('typing');
  await sleep(450);
  await ctx.reply(text, extra);
}

bot.action(/^rent_(.+)$/, async (ctx) => {
  const toolId = ctx.match[1];
  rentData[ctx.from.id] = { step: 0, data: {}, toolId };
  await ctx.reply(`<b>Шаг 1 из 4</b>\n${RENT_STEPS[0]}`, {
    parse_mode: 'HTML',
    ...Markup.keyboard([['🏠 Меню']]).resize(),
  });
  await ctx.answerCbQuery();
});

bot.on('text', async (ctx, next) => {
  const state = rentData[ctx.from.id];
  if (!state) return next();

  if (ctx.message.text === '🏠 Меню') {
    delete rentData[ctx.from.id];
    return ctx.reply('Главное меню:', mainMenu);
  }

  const { step, data, toolId } = state;
  const tool = tools.find((t) => t.id === toolId);

  switch (step) {
    case 0:
      if (ctx.message.text.length < 2) return typingAndReply(ctx, 'Введите корректное имя.');
      data.name = ctx.message.text.trim();
      state.step++;
      await typingAndReply(ctx, '✅ Имя принято!');
      await typingAndReply(ctx, `<b>Шаг 2 из 4</b>\n${RENT_STEPS[1]}`, { parse_mode: 'HTML' });
      break;
    case 1:
      if (!/^8\d{10}$/.test(ctx.message.text)) {
        return typingAndReply(ctx, 'Телефон должен содержать 11 цифр и начинаться с 8. Пример: 89291234567');
      }
      data.phone = ctx.message.text;
      state.step++;
      await typingAndReply(ctx, '✅ Телефон принят!');
      await typingAndReply(ctx, `<b>Шаг 3 из 4</b>\n${RENT_STEPS[2]}`, { parse_mode: 'HTML' });
      break;
    case 2:
      if (!/^\d{2}\.\d{2}\.\d{4}$/.test(ctx.message.text)) return typingAndReply(ctx, 'Дата в формате ДД.ММ.ГГГГ');
      data.dateStart = ctx.message.text;
      state.step++;
      await typingAndReply(ctx, '📅 Дата начала принята!');
      await typingAndReply(ctx, `<b>Шаг 4 из 4</b>\n${RENT_STEPS[3]}`, { parse_mode: 'HTML' });
      break;
    case 3:
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(ctx.message.text)) return typingAndReply(ctx, 'Дата в формате ДД.ММ.ГГГГ');
  data.dateEnd = ctx.message.text;
  const days = 1 + calcDays(data.dateStart, data.dateEnd);
  if (days < 1) return typingAndReply(ctx, 'Аренда минимум на 1 сутки! Дата окончания должна быть не раньше даты начала.');
  if (days > 30) return typingAndReply(ctx, 'Аренда не больше 30 дней подряд.');

  // --- Вот тут новый расчёт ---
  const rentSum = calcToolPrice(tool.id, days);
  const sum = rentSum + tool.deposit;
  state.data = { ...data, days, sum, rentSum }; // rentSum для красивого отображения

  // Красивая заявка
  const text =
    `<b>Проверьте заявку:</b>\n\n` +
    `🔧 <b>Инструмент:</b> <i>${tool.name}</i>\n` +
    `🙍 <b>Имя:</b> <i>${data.name}</i>\n` +
    `📞 <b>Телефон:</b> <i>${data.phone}</i>\n` +
    `📅 <b>Срок:</b> <i>${data.dateStart} — ${data.dateEnd}</i>\n` +
    `🕒 <b>Дней:</b> <i>${days}</i>\n\n` +
    `💰 <b>К оплате:</b> <b>${rentSum}₽ + залог ${tool.deposit}₽ = <u>${sum}₽</u></b>\n\n` +
    `Всё верно?`;
  await typingAndReply(ctx, text, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('✅ Всё верно', 'confirm_rent')],
      [Markup.button.callback('⬅️ Назад', 'rent_back')],
      [Markup.button.callback('🏠 Меню', 'menu')],
    ]),
  });
  break;
  }
});

bot.action('rent_back', async (ctx) => {
  const state = rentData[ctx.from.id];
  if (!state) return ctx.answerCbQuery('Нет активной формы.');
  if (state.step > 0) state.step--;
  await ctx.reply(`<b>Шаг ${state.step + 1} из 4</b>\n${RENT_STEPS[state.step]}`, { parse_mode: 'HTML' });
  await ctx.answerCbQuery();
});
bot.action('confirm_rent', async (ctx) => {
  const state = rentData[ctx.from.id];
  if (!state) return ctx.answerCbQuery('Форма устарела.');
  const { data, toolId } = state;
  const tool = tools.find((t) => t.id === toolId);

  try {
    await appendOrderToSheet({
      name: data.name,
      phone: data.phone,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd,
      days: data.days,
      sum: data.sum
    }, tool);

    // --- Добавляем в календарь ---
    await addOrderToCalendar({
      name: data.name,
      phone: data.phone,
      dateStart: data.dateStart,
      dateEnd: data.dateEnd
    }, tool);

  } catch (e) {
    await ctx.reply('⚠️ Не удалось записать заявку в таблицу или календарь. Попробуйте ещё раз или обратитесь к администратору.');
  }

  // --- Отправка владельцу ---
  const msg =
    `📝 <b>Новая заявка!</b>\n` +
    `🔧 <b>Инструмент:</b> ${tool.name}\n` +
    `🙍 <b>Имя:</b> ${data.name}\n` +
    `📞 <b>Телефон:</b> ${data.phone}\n` +
    `📅 <b>Срок:</b> ${data.dateStart} — ${data.dateEnd} (${data.days} дней)\n` +
    `💰 <b>Сумма:</b> ${state.data.rentSum}₽ + залог ${tool.deposit}₽ = <b>${state.data.sum}₽</b>`;
  await ctx.telegram.sendMessage(process.env.OWNER_CHAT_ID, msg, { parse_mode: 'HTML' });

  await ctx.reply('🎯 <b>Ваша заявка успешно принята!</b>\n\n' +
    'Спасибо за ваш выбор!\n' +
    '🎉Команда Prokat63 уже работает над вашим запросом.\n' +
    'Ждите звонка нашего менеджера — совсем скоро аренда станет проще!\n' +
    'Хорошего дня! ☀️.',
    {
      parse_mode: 'HTML',
      ...mainMenu
    }
  );
  delete rentData[ctx.from.id];
  await ctx.answerCbQuery();
});

bot.action('menu', async (ctx) => {
  delete rentData[ctx.from.id];
  await ctx.reply('Главное меню:', mainMenu);
  await ctx.answerCbQuery();
});

// --- Как арендовать ---
bot.hears('📦 Как арендовать', (ctx) =>
  ctx.reply(
    '🛠 <b>Как арендовать инструмент?</b>\n\n' +
    '1️⃣ Выберите инструмент в списке\n' +
    '2️⃣ Нажмите <b>Арендовать</b>\n' +
    '3️⃣ Заполните заявку (имя, телефон, даты)\n' +
    '4️⃣ Получите адрес и инструкции для самовывоза.\n\n',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📋 Список инструментов', 'go_tools')],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ]),
    }
  )
);

// --- Связаться с нами ---
bot.hears('📞 Связаться с нами', (ctx) =>
  ctx.reply(
    '📱 <b>Телефон:</b> +7 929 569-69-90\n' +
    '📍 <b>Адрес:</b> г. Новокуйбышевск, Гаражный бокс\n' +
    '🌍 <b>Координаты:</b> 53.100704, 49.966212\n' +
    '🕘 9:00–21:00\n' +
    '💵 Оплата: наличные / перевод',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📍 Где забрать?', 'where_pickup')],
        [Markup.button.url('2ГИС', 'https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.96506%2C53.100221%2F18.65')],
        [Markup.button.url('Яндекс.Карты', 'https://yandex.ru/maps/?ll=49.966212%2C53.100704&z=17')],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ])
    }
  )
);

// --- Где забрать ---
bot.hears('📍 Где забрать?', async (ctx) => {
  await ctx.reply('Пункт выдачи: г. Новокуйбышевск, Гаражный бокс\nКоординаты: 53.100704, 49.966212');
  await ctx.replyWithLocation(53.100704, 49.966212);
  await ctx.reply(
    'Открыть в 2ГИС: https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.96506%2C53.100221%2F18.65\n' +
    'Открыть в Яндекс.Картах: https://yandex.ru/maps/?ll=49.966212%2C53.100704&z=17',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Меню', 'menu')],
    ])
  );
});

bot.action('where_pickup', async (ctx) => {
  await ctx.reply('Пункт выдачи: г. Новокуйбышевск, Гаражный бокс\nКоординаты: 53.100704, 49.966212');
  await ctx.replyWithLocation(53.100704, 49.966212);
  await ctx.reply(
    'Открыть в 2ГИС: https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.96506%2C53.100221%2F18.65\n' +
    'Открыть в Яндекс.Картах: https://yandex.ru/maps/?ll=49.966212%2C53.100704&z=17',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Меню', 'menu')],
    ])
  );
  await ctx.answerCbQuery();
});

// --- "Список инструментов" из "Как арендовать" ---
bot.action('go_tools', async (ctx) => {
  const buttons = tools.map(tool => [
    Markup.button.callback(`${tool.name} — ${tool.price}₽`, `show_${tool.id}`)
  ]);
  await ctx.reply('Выберите инструмент:', Markup.inlineKeyboard(buttons));
  await ctx.answerCbQuery();
});

// --- Отзывы ---
bot.hears('💬 Отзывы', (ctx) =>
  ctx.reply('Ваш отзыв очень важен! Напишите его прямо в чат.',
    Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Меню', 'menu')],
    ])
  )
);

// --- О нас ---
bot.hears('⚙️ О нас', (ctx) =>
  ctx.reply(
    'Добро пожаловать в Prokat63 — сервис аренды строительного и садового инструмента в Новокуйбышевске.\n\n' +
    'У нас вы можете взять в прокат надёжный инструмент по доступной цене — от перфоратора и триммера до виброплиты и мотобура.\n\n' +
    '✅ Только проверенное оборудование\n' +
    '✅ Гибкие сроки аренды — от 1 дня\n' +
    '✅ Удобный самовывоз\n' +
    '✅ Быстрая обратная связь\n' +
    '✅ Прозрачные условия и залог\n\n' +
    '🎯 Наша цель — сделать аренду простой и доступной для каждого.\n' +
    'Не нужно покупать дорогой инструмент ради одной работы — арендуйте у нас и пользуйтесь, когда нужно.\n\n' +
    '📍 Город: Новокуйбышевск\n' +
    '🕒 График работы: ежедневно с 9:00 до 20:00\n' +
    '📞 Есть вопросы? Напишите в бот или позвоните — всегда на связи.',
    Markup.inlineKeyboard([
      [Markup.button.callback('📞 Связаться с нами', 'go_contact')],
      [Markup.button.callback('🏠 Меню', 'menu')],
    ])
  )
);

bot.action('go_contact', async (ctx) => {
  await ctx.reply(
    '📱 <b>Телефон:</b> +7 929 569-69-90\n' +
    '📍 <b>Адрес:</b> г. Новокуйбышевск, Гаражный бокс\n' +
    '🌍 <b>Координаты:</b> 53.100704, 49.966212\n' +
    '🕘 9:00–21:00\n' +
    '💵 Оплата: наличные / перевод',
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📍 Где забрать?', 'where_pickup')],
        [Markup.button.url('2ГИС', 'https://2gis.ru/novokujbyshevsk/firm/70000001103003351/49.966319%2C53.100478?m=49.96506%2C53.100221%2F18.65')],
        [Markup.button.url('Яндекс.Карты', 'https://yandex.ru/maps/?ll=49.966212%2C53.100704&z=17')],
        [Markup.button.callback('🏠 Меню', 'menu')],
      ])
    }
  );
  await ctx.answerCbQuery();
});

// --- days calc ---
function calcDays(start, end) {
  const [ds, ms, ys] = start.split('.').map(Number);
  const [de, me, ye] = end.split('.').map(Number);
  const d1 = new Date(ys, ms - 1, ds);
  const d2 = new Date(ye, me - 1, de);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// --- Запуск ---
bot.launch();
console.log('Bot started!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
