const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Halo! Selamat datang di Bot Pengaduan Perpustakaan. Silakan tulis laporan Anda.'));

bot.on('text', async (ctx) => {
  const laporan = ctx.message.text;
  const dari = ctx.from.username || ctx.from.first_name;

  // 1. Kirim balasan ke pengguna
  await ctx.reply('Laporan Anda sudah kami terima. Terima kasih!');

  // 2. TERUSKAN LAPORAN KE KAMU (ADMIN)
  // Ganti 'ID_TELEGRAM_MU' dengan ID Telegram asli kamu (berupa angka)
  await ctx.telegram.sendMessage('8712077042', `📢 *Laporan Baru!*\nDari: @${dari}\nIsi: ${laporan}`, { parse_mode: 'Markdown' });
});

module.exports = async (req, res) => {
  // Telegram mengirim data menggunakan metode POST
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Error');
    }
  } else {
    // Jika dibuka lewat browser (GET), tampilkan pesan ini
    res.status(200).send('Bot berjalan, silakan kirim pesan lewat Telegram.');
  }
};
