module.exports = (bot, userHistory) => {
  bot.command('history', ctx => {
    const hist = userHistory.get(ctx.chat.id) || [];
    if (!hist.length) return ctx.reply('📂 У вас нет аренд.');
    const out = hist.map((h,i)=>
      `#${i+1} ${h.tool}\n` +
      `📅 ${h.startDate} → ${h.endDate}\n` +
      `💰 ${h.total}₽`
    ).join('\n\n');
    ctx.reply(`📜 История аренд:\n\n${out}`);
  });
};
