const { Telegraf } = require('telegraf');

// Pastikan token diambil dari Environment Variables Vercel
const bot = new Telegraf(process.env.BOT_TOKEN);

// GANTI DENGAN ID KAMU (ANGKA MURNI)
const ADMIN_ID = 8712077042; 

// Database sementara untuk menyimpan urutan pertanyaan
const userState = {};

// 1. Perintah Start
bot.start((ctx) => {
  const userId = ctx.from.id;
  userState[userId] = { step: 1 };
  return ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan Universitas Nurul Jadid\n\nKetik Nama Lengkap Anda:');
});

// 2. Logika Alur Pertanyaan (Switch-Case)
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const msg = ctx.message.text;

  if (msg.startsWith('/')) return; // Abaikan command lain
  if (!userState[userId]) return; // Abaikan jika tidak dalam sesi

  const state = userState[userId];

  try {
    switch (state.step) {
      case 1:
        state.nama = msg;
        state.step = 2;
        return await ctx.reply('Masukkan NIM atau (-) jika anda bukan mahasiswa:');
      case 2:
        state.nim = msg;
        state.step = 3;
        return await ctx.reply('Tuliskan kontak yang dapat dihubungi (WA/Tele/Email):');
      case 3:
        state.kontak = msg;
        state.step = 4;
        return await ctx.reply('Jenis Pengaduan:\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya\n\nKetik angka 1–5:');
      case 4:
        const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };
        state.jenis = kategori[msg] || 'Lainnya';
        state.step = 5;
        return await ctx.reply('Tuliskan Isi Pengaduan:');
      case 5:
        state.isi = msg;
        const laporan = `📢 *PENGADUAN BARU*\n\n👤 Nama: ${state.nama}\n🆔 NIM: ${state.nim}\n📞 Kontak: ${state.kontak}\n📂 Jenis: ${state.jenis}\n📝 Isi: ${state.isi}`;
        
        // Kirim ke Admin (Gunakan catch agar jika gagal tidak merusak alur user)
        await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' }).catch(e => console.log("Gagal kirim ke admin"));

        // Hapus state agar bersih
        delete userState[userId]; 

        // Tampilkan tombol Ya / Tidak
        return await ctx.reply('Pengaduan Anda sudah kami terima. Apakah ada pengaduan lagi?', {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Ya', callback_data: 'ulang' },
                { text: 'Tidak', callback_data: 'selesai' }
              ]
            ]
          }
        });
    }
  } catch (err) {
    console.error("Error utama:", err);
  }
});

// 3. Logika Klik Tombol (Action)
bot.action('ulang', async (ctx) => {
  await ctx.answerCbQuery();
  userState[ctx.from.id] = { step: 1 };
  return ctx.reply('Baik, silakan ketik Nama Lengkap Anda:');
});

bot.action('selesai', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.editMessageText('Terima kasih! Laporan Anda sedang kami proses.');
});

// 4. Export untuk Vercel (PENTING: Jangan gunakan bot.launch())
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('Bot Aktif!');
  }
};
