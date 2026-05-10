const { Telegraf } = require('telegraf');

// Pastikan BOT_TOKEN sudah diisi di Environment Variables Vercel
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Halo! Selamat datang di Bot Pengaduan Perpustakaan. Silakan tulis laporan atau keluhan Anda di sini.'));

bot.on('text', async (ctx) => {
  try {
    // Balasan otomatis ke pengguna
    await ctx.reply('Laporan Anda sudah kami terima. Terima kasih sudah membantu kami meningkatkan layanan!');
  } catch (err) {
    console.error('Error saat membalas pesan:', err);
  }
});

// Fungsi utama untuk Vercel
module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      // PENTING: Tambahkan await di sini agar Vercel menunggu Telegram selesai
      await bot.handleUpdate(req.body);
      return res.status(200).send('OK');
    } else {
      return res.status(200).send('Bot sedang berjalan! (Gunakan POST untuk webhook)');
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    return res.status(500).send('Ada error di server bot');
  }
};
