const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

// Pesan saat orang pertama kali klik 'Start'
bot.start((ctx) => ctx.reply('Halo! Silakan tulis pengaduan Anda di sini.'));

// Logika saat menerima pesan
bot.on('text', (ctx) => {
  // Balasan otomatis ke pengguna
  ctx.reply('Laporan Anda sudah kami terima. Terima kasih!');
  
  // (Opsional) Kirim laporan ke kamu sebagai admin
  // bot.telegram.sendMessage('ID_TELEGRAM_MU', `Laporan baru: ${ctx.message.text}`);
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot sedang berjalan!');
  }
};
