// ... (bagian atas tetap sama)

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const msg = ctx.message.text;

  // 1. ABAIKAN JIKA ITU PERINTAH /START
  if (msg.startsWith('/')) return;
  
  // 2. ABAIKAN JIKA USER TIDAK SEDANG DALAM SESI (Pencegahan Salbut)
  if (!userState[userId]) {
    return ctx.reply('Silakan ketik /start untuk memulai pengaduan.');
  }

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
        
        // Kirim ke Admin
        await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' }).catch(e => console.log("Gagal kirim admin"));

        // HAPUS STATE SEBELUM MENAMPILKAN TOMBOL
        delete userState[userId]; 

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
    console.error(err);
    return ctx.reply('Maaf, ada gangguan. Ketik /start ya.');
  }
});

// --- TARUH DI SINI (DI LUAR bot.on) ---
bot.action('ulang', async (ctx) => {
  await ctx.answerCbQuery();
  userState[ctx.from.id] = { step: 1 };
  return ctx.reply('Sip! Ketik Nama Lengkap Anda:');
});

bot.action('selesai', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.editMessageText('Terima kasih! Laporan Anda sedang kami proses.');
});
