const { Telegraf } = require('telegraf');

// Inisialisasi Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// KONFIGURASI: Ganti dengan ID Telegram Anda (Angka murni)
const ADMIN_ID = 7812077042; 

// Database temporary (akan tersimpan selama server Vercel aktif)
const userState = {};

// 1. Perintah /start
bot.start((ctx) => {
  const userId = ctx.from.id;
  // Reset data ke awal
  userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
  return ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan ketik Nama Lengkap Anda:');
});

// Handler untuk perintah /stop
bot.command('stop', async (ctx) => {
    const userId = ctx.from.id;
    
    if (userState[userId]) {
        delete userState[userId]; // Hapus data state user
        return await ctx.reply("🚫 Sesi pengaduan telah dihentikan. Ketik /start untuk memulai kembali.");
    }
    
    return await ctx.reply("Tidak ada sesi aktif yang sedang berjalan.");
});

// Handler untuk perintah /bantuan
bot.command('bantuan', async (ctx) => {
    return await ctx.reply(
        "🆘 *Bantuan Layanan Pengaduan*\n\n" +
        "Jika Anda mengalami kendala dalam penggunaan bot ini atau memiliki pertanyaan lebih lanjut, silakan hubungi admin Perpustakaan melalui :\n\n" +
        "👉 @perpus_unuja\n\n" +
        "Ketik /start untuk memulai pengaduan atau /stop untuk membatalkan sesi yang sedang berjalan.",
        { parse_mode: 'Markdown' }
    );
});

// 2. Handler Pesan Teks
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const msg = ctx.message.text;

  // Abaikan jika command atau user tidak dalam sesi aktif
  if (msg.startsWith('/') || !userState[userId]) return;

  const state = userState[userId];

  try {
    switch (state.step) {
      case 1: // Simpan Nama
        state.nama = msg;
        state.step = 2;
        return await ctx.reply(`Salam, ${state.nama}!\nMasukkan NIM Anda (atau '-' jika bukan mahasiswa):`);

      case 2: // Simpan NIM
        state.nim = msg;
        state.step = 3;
        return await ctx.reply('Tuliskan nomor WhatsApp atau Telegram yang bisa dihubungi:');

      case 3: // Simpan Kontak
        state.kontak = msg;
        state.step = 4;
        return await ctx.reply('Pilih Jenis Pengaduan (Ketik angka 1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');

      case 4: // Simpan Jenis
    const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };

    // Cek apakah input ada di dalam kunci objek kategori
    if (!kategori[msg]) {
        return await ctx.reply("⚠️ Pilihan tidak valid. Silakan ketik angka 1 sampai 5 saja sesuai menu:");
    }

    state.jenis = kategori[msg];
    state.step = 5;
    return await ctx.reply(`Jenis: ${state.jenis}\n\nSekarang, silakan tuliskan isi pengaduan Anda secara lengkap:`);
      case 5: // Simpan Isi & Kirim
        state.isi = msg;
        
        const laporan = `📢 *PENGADUAN BARU*\n\n` +
                        `👤 *Nama:* ${state.nama}\n` +
                        `🆔 *NIM:* ${state.nim}\n` +
                        `📞 *Kontak:* ${state.kontak}\n` +
                        `📂 *Jenis:* ${state.jenis}\n` +
                        `📝 *Isi:* ${state.isi}`;
        
        // Kirim ke Admin
        await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' }).catch(e => console.log("Gagal kirim admin"));

        // Set ke step 0 (Menunggu pilihan tombol, tidak merespon teks biasa)
        state.step = 0;

        return await ctx.reply(`Terima kasih ${state.nama}, laporan telah kami teruskan.\nApakah ada hal lain yang ingin diadukan lagi?`, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: 'Ya (Buat Aduan Baru)', callback_data: 'ulang_aduan' },
                { text: 'Tidak (Selesai)', callback_data: 'tutup_sesi' }
              ]
            ]
          }
        });
    }
  } catch (err) {
    console.error(err);
    return ctx.reply('Terjadi kesalahan teknis. Ketik /start untuk mencoba lagi.');
  }
});

// 3. Handler Klik Tombol
bot.action('ulang_aduan', async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from.id;

  if (userState[userId]) {
    // LANGSUNG KE STEP 4 (Pilih Jenis) karena Nama/NIM sudah ada
    userState[userId].step = 4;
    return ctx.reply('Silakan pilih kembali Jenis Pengaduan (1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');
  } else {
    // Jika data hilang (server restart), minta mulai dari awal
    return ctx.reply('Sesi berakhir. Ketik /start untuk mulai kembali.');
  }
});

bot.action('tutup_sesi', async (ctx) => {
  await ctx.answerCbQuery();
  delete userState[ctx.from.id]; // Hapus data secara total
  return ctx.editMessageText('Terima kasih telah berkontribusi untuk kemajuan Perpustakaan UNUJA.');
});

// 4. Export Webhook untuk Vercel
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('Bot Status: Online');
  }
};
