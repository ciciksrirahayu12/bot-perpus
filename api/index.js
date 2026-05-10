const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

const ADMIN_ID = '8712077042'; // Ganti dengan ID dari @userinfobot
const userState = {}; // Tempat menyimpan sementara jawaban user

// 1. Perintah Start
bot.start((ctx) => {
  const userId = ctx.from.id;
  userState[userId] = { step: 1 }; // Reset ke langkah pertama
  ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan Universitas Nurul Jadid\n\nKetik Nama Lengkap Anda:');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const msg = ctx.message.text;

  // Jika user tidak dalam proses mengisi formulir, abaikan atau beri info
  if (!userState[userId]) return;

  const state = userState[userId];

  try {
    switch (state.step) {
      case 1: // Simpan Nama -> Tanya NIM
        state.nama = msg;
        state.step = 2;
        await ctx.reply('Masukkan NIM atau (-) jika anda bukan mahasiswa:');
        break;

      case 2: // Simpan NIM -> Tanya Kontak
        state.nim = msg;
        state.step = 3;
        await ctx.reply('Tuliskan kontak yang dapat dihubungi\n(Whatsapp / Telegram / Email):');
        break;

      case 3: // Simpan Kontak -> Tanya Jenis
        state.kontak = msg;
        state.step = 4;
        await ctx.reply('Jenis Pengaduan:\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya\n\nKetik angka 1–5:');
        break;

      case 4: // Simpan Jenis -> Tanya Isi
        const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };
        state.jenis = kategori[msg] || 'Lainnya';
        state.step = 5;
        await ctx.reply('Tuliskan Isi Pengaduan:');
        break;

      case 5: // Simpan Isi -> Kirim ke Admin -> Tanya pengaduan lagi?
        state.isi = msg;
        
        // Kirim Laporan ke Admin
        const laporan = `📢 *PENGADUAN BARU*\n\n` +
                        `👤 *Nama:* ${state.nama}\n` +
                        `🆔 *NIM:* ${state.nim}\n` +
                        `📞 *Kontak:* ${state.kontak}\n` +
                        `📂 *Jenis:* ${state.jenis}\n` +
                        `📝 *Isi:* ${state.isi}`;
        
        await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' });

        // JANGAN LANGSUNG DELETE, tapi tawarkan tombol
        await ctx.reply('Pengaduan Anda sudah kami terima. Apakah ada pengaduan lagi?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Ya, Buat Pengaduan Lagi', callback_data: 'ulang_pengaduan' }],
              [{ text: 'Tidak, Terima Kasih', callback_data: 'selesai_pengaduan' }]
            ]
          }
        });
        
        // Tetap hapus state agar tidak nyangkut di step 5 jika user mengetik teks biasa
        delete userState[userId]; 
        break;
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('Maaf, terjadi kesalahan. Silakan ketik /start untuk mengulang.');
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Bot UNUJA Aktif!');
  }
};
