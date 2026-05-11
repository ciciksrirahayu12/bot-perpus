const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on('text', async (ctx) => {
    try {
        // GANTI ANGKA INI DENGAN ID YANG MUNCUL DI LANGKAH 2 TADI
        await ctx.telegram.sendMessage(7812077042, "Laporan: " + ctx.message.text);
        return ctx.reply("✅ TERKIRIM");
    } catch (e) {
        return ctx.reply("❌ GAGAL: " + e.message);
    }
});

module.exports = async (req, res) => {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
};
