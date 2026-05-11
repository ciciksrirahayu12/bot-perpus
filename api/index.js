const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 7812077042; // ID Admin (Pastikan angka murni)
const userState = {};

bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
    return ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan ketik Nama Lengkap Anda:');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;
    if (msg.startsWith('/') || !userState[userId]) return;

    const state = userState[userId];

    try {
        switch (state.step) {
            case 1:
                state.nama = msg;
                state.step = 2;
                return await ctx.reply(`Salam, ${state.nama}!\nMasukkan NIM Anda (atau '-' jika bukan mahasiswa):`);

            case 2:
                state.nim = msg;
                state.step = 3;
                return await ctx.reply('Tuliskan nomor WhatsApp atau Telegram yang bisa dihubungi:');

            case 3:
                state.kontak = msg;
                state.step = 4;
                return await ctx.reply('Pilih Jenis Pengaduan (Ketik angka 1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');

            case 4:
                const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };
                if (!kategori[msg]) return await ctx.reply("⚠️ Pilihan tidak valid. Silakan ketik angka 1 sampai 5 saja:");
                state.jenis = kategori[msg];
                state.step = 5;
                return await ctx.reply(`Jenis: ${state.jenis}\n\nSekarang, silakan tuliskan isi pengaduan Anda secara lengkap:`);

        //     case 5:
        //         state.isi = msg;
        //         state.tiketId = `LP-${Date.now()}`;
        //         await ctx.reply("⏳ Sedang meneruskan laporan Anda ke admin...");

        //         const laporan = `📢 *PENGADUAN BARU*\n\n` +
        //                         `🎫 *Tiket:* #${state.tiketId}\n` +
        //                         `👤 *Nama:* ${state.nama}\n` +
        //                         `🆔 *NIM:* ${state.nim}\n` +
        //                         `📞 *Kontak:* ${state.kontak}\n` +
        //                         `📂 *Jenis:* ${state.jenis}\n` +
        //                         `📝 *Isi:* ${state.isi}\n\n` +
        //                         `📅 *Waktu:* ${new Date().toLocaleString('id-ID')}`;

        //         try {
        //             // PENGIRIMAN KRITIS
        //             const sent = await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' });
                    
        //             if (sent) {
        //                 delete userState[userId]; 
        //                 return await ctx.reply(
        //                     `✅ Laporan Terkirim ke Admin!\nNomor Tiket: ${state.tiketId}\n\nAda lagi yang ingin diadukan?`, 
        //                     {
        //                         reply_markup: {
        //                             inline_keyboard: [
        //                                 [{ text: 'Ya', callback_data: 'ulang_aduan' }, { text: 'Tidak', callback_data: 'tutup_sesi' }]
        //                             ]
        //                         }
        //                     }
        //                 );
        //             }
        //         } catch (err) {
        //             // Jika gagal kirim ke admin, user dapet info jujur
        //             return await ctx.reply(`❌ Gagal meneruskan ke admin.\nDetail: ${err.message}\n\nAdmin wajib klik START dulu di bot ini.`);
        //         }
        //         break;
        //         console.log("Mencoba mengirim ke ID:", ADMIN_ID);
        // }

            case 5:
                state.isi = msg;
                state.tiketId = `LP-${Date.now()}`;
                
                await ctx.reply("⏳ Meneruskan ke admin...");

                try {
                    // 1. GUNAKAN ID DALAM BENTUK ANGKA LANGSUNG DI SINI
                    // 2. KIRIM PESAN TEKS BIASA DULU (TANPA MARKDOWN) UNTUK TES
                    await ctx.telegram.sendMessage(7812077042, `📢 LAPORAN BARU\nNama: ${state.nama}\nIsi: ${state.isi}`);
                    
                    delete userState[userId];
                    return await ctx.reply("✅ BERHASIL! Cek HP Admin sekarang.");
                } catch (err) {
                    // Jika ini muncul, berarti ID 7812077042 BELUM klik START di bot yang BENAR
                    return await ctx.reply(`❌ ERROR: ${err.message}`);
                }
                
    } catch (err) {
        return await ctx.reply('Terjadi kesalahan teknis.');
    }
});

// Handler Tombol
bot.action('ulang_aduan', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    userState[userId] = { step: 4 }; // Langsung balik ke pilih jenis agar cepat
    return ctx.reply('Silakan pilih kembali Jenis Pengaduan (1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');
});

bot.action('tutup_sesi', async (ctx) => {
    await ctx.answerCbQuery();
    delete userState[ctx.from.id];
    return ctx.editMessageText('Terima kasih telah berkontribusi untuk kemajuan Perpustakaan UNUJA.');
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) { res.status(200).send('OK'); }
    } else {
        res.status(200).send('Bot is Running');
    }
};
