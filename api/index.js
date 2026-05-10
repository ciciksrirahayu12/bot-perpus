const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

// GANTI dengan ID kamu dari @userinfobot
const ADMIN_ID = '12345678'; 

// 1. Perintah Start
bot.start((ctx) => {
  return ctx.reply('Halo! Selamat datang di Bot Pengaduan Perpustakaan. Silakan tulis laporan Anda di bawah ini.');
});

// 2. Logika Menangkap Laporan (Hanya jika bukan perintah /)
bot.on('text', async (ctx) => {
  const pesanMasuk = ctx.message.text;
  const chatId = ctx.chat.id.toString();
  const pengirim = ctx.from.first_name;
  const username = ctx.from.username ? `@${ctx.from.username}` : 'Tanpa Username';

  // JANGAN proses jika ini adalah perintah (dimulai dengan /)
  if (pesanMasuk.startsWith('/')) return;

  // JANGAN proses jika ini adalah pesan yang dikirim di chat Admin (agar tidak looping)
  if (chatId === ADMIN_ID) {
    return ctx.reply('Sistem stand-by. Menunggu laporan masuk...');
  }

  try {
    // Balas ke User
    await ctx.reply('Laporan Anda sudah kami terima. Terima kasih!');

    // Kirim ke Admin
    const teksUntukAdmin = `📢 *LAPORAN BARU*\n\n` +
                           `👤 *Dari:* ${pengirim} (${username})\n` +
                           `📝 *Isi:* ${pesanMasuk}`;
    
    await ctx.telegram.sendMessage(ADMIN_ID, teksUntukAdmin, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('Gagal kirim laporan:', err);
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(500).send('Error');
    }
  } else {
    res.status(200).send('Bot Aktif!');
  }
};
