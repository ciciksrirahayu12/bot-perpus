const { Telegraf } = require('telegraf');

// Inisialisasi Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// KONFIGURASI: Ganti dengan ID Telegram Anda (Angka murni)
const ADMIN_ID = 7812077042; 

// Database temporary (akan tersimpan selama server Vercel aktif)
const userState = {};

bot.command('tes', async (ctx) => {
    try {
        await ctx.telegram.sendMessage(ADMIN_ID, "Halo Admin! Bot bisa mengirim pesan ke sini.");
        await ctx.reply("✅ Berhasil kirim tes ke Admin!");
    } catch (err) {
        await ctx.reply(`❌ Gagal! Error: ${err.description}`);
    }
});

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
        { parse_mode: 'HTML' }
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
      case 5: // Tahap Akhir: Kirim Laporan Langsung ke Admin
    state.isi = msg;
    
    // 1. Generate ID Tiket Unik
    const tiketId = `LP-${Date.now()}`;
    state.tiketId = tiketId;

    await ctx.reply("⏳ Sedang meneruskan laporan Anda ke admin...");

    try {
        // 2. Susun Format Laporan (HTML)
        const pesanAdmin = 
            `<b>📢 PENGADUAN BARU MASUK</b>\n\n` +
            `🎫 <b>Tiket:</b> #${state.tiketId}\n` +
            `👤 <b>Nama:</b> ${state.nama}\n` +
            `🆔 <b>NIM:</b> ${state.nim}\n` +
            `📞 <b>Kontak:</b> ${state.kontak}\n` +
            `📂 <b>Jenis:</b> ${state.jenis}\n` +
            `📝 <b>Isi:</b> ${state.isi}\n\n` +
            `📅 <i>Waktu: ${new Date().toLocaleString('id-ID')}</i>`;

        // 3. Kirim ke ID Admin (Pastikan ADMIN_ID sudah benar)
        await ctx.telegram.sendMessage(ADMIN_ID, pesanAdmin, { parse_mode: 'HTML' });

        // 4. Ubah Step ke 0 agar aman
        state.step = 0;

        // 5. Konfirmasi ke User + Tombol Interaktif
        await ctx.reply(
            `✅ <b>Laporan Terkirim!</b>\n\n` +
            `Nomor Tiket: <code>${state.tiketId}</code>\n` +
            `Admin akan segera menindaklanjuti laporan Anda.\n\n` +
            `Ada lagi yang ingin diadukan?`, 
            {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Ya (Buat Baru)', callback_data: 'ulang_aduan' },
                            { text: 'Tidak (Selesai)', callback_data: 'tutup_sesi' }
                        ]
                    ]
                }
            }
        );

    } catch (error) {
        console.error("Gagal kirim ke admin:", error.message);
        await ctx.reply("❌ Maaf, bot gagal menghubungi admin. Pastikan Anda sudah menekan /start di bot ini.");
    }
    break;
    } catch (error) {
        console.error("Error di Case 5:", error);
        await ctx.reply("❌ Maaf, terjadi kesalahan saat menyimpan laporan. Silakan coba lagi nanti.");
    }
    break;
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
