const { Telegraf } = require('telegraf');

// Inisialisasi Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// KONFIGURASI: ID Admin
const ADMIN_ID = 7812077042; 

// Database temporary
const userState = {};

// Command /tes
bot.command('tes', async (ctx) => {
    try {
        await ctx.telegram.sendMessage(ADMIN_ID, "Halo Admin! Bot bisa mengirim pesan ke sini.");
        await ctx.reply("✅ Berhasil kirim tes ke Admin!");
    } catch (err) {
        await ctx.reply(`❌ Gagal! Error: ${err.description || err.message}`);
    }
});

// 1. Perintah /start
bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
    return ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan ketik Nama Lengkap Anda:');
});

// Handler untuk perintah /stop
bot.command('stop', async (ctx) => {
    const userId = ctx.from.id;
    if (userState[userId]) {
        delete userState[userId];
        return await ctx.reply("🚫 Sesi pengaduan telah dihentikan. Ketik /start untuk memulai kembali.");
    }
    return await ctx.reply("Tidak ada sesi aktif yang sedang berjalan.");
});

// Handler untuk perintah /bantuan
bot.command('bantuan', async (ctx) => {
    return await ctx.reply(
        "🆘 <b>Bantuan Layanan Pengaduan</b>\n\n" +
        "Jika Anda mengalami kendala, hubungi admin melalui:\n" +
        "👉 @perpus_unuja\n\n" +
        "Ketik /start untuk mulai atau /stop untuk batal.",
        { parse_mode: 'HTML' }
    );
});

// 2. Handler Pesan Teks
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
                if (!kategori[msg]) {
                    return await ctx.reply("⚠️ Pilihan tidak valid. Silakan ketik angka 1 sampai 5 saja:");
                }
                state.jenis = kategori[msg];
                state.step = 5;
                return await ctx.reply(`Jenis: ${state.jenis}\n\nSekarang, silakan tuliskan isi pengaduan Anda secara lengkap:`);

            case 5:
                state.isi = msg;
                state.tiketId = `LP-${Date.now()}`;

                await ctx.reply("⏳ Sedang meneruskan laporan Anda ke admin...");

                try {
                    const laporanPolos = 
                        `📢 PENGADUAN BARU MASUK\n\n` +
                        `🎫 Tiket: #${state.tiketId}\n` +
                        `👤 Nama: ${state.nama}\n` +
                        `🆔 NIM: ${state.nim}\n` +
                        `📞 Kontak: ${state.kontak}\n` +
                        `📂 Jenis: ${state.jenis}\n` +
                        `📝 Isi: ${state.isi}\n\n` +
                        `📅 Waktu: ${new Date().toLocaleString('id-ID')}`;

                    await ctx.telegram.sendMessage(ADMIN_ID, laporanPolos);

                    state.step = 0;
                    return await ctx.reply(
                        `✅ Laporan Terkirim!\nNomor Tiket: ${state.tiketId}\n\nAda lagi yang ingin diadukan?`, 
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: 'Ya', callback_data: 'ulang_aduan' },
                                        { text: 'Tidak', callback_data: 'tutup_sesi' }
                                    ]
                                ]
                            }
                        }
                    );
                } catch (err) {
                    console.error("GAGAL KIRIM KE ADMIN:", err.message);
                    return ctx.reply(`❌ Gagal meneruskan ke admin.\nDetail Error: ${err.message}`);
                }
        }
    } catch (err) {
        console.error("Error Handler:", err);
        return ctx.reply('Terjadi kesalahan teknis. Ketik /start untuk mencoba lagi.');
    }
});

// 3. Handler Klik Tombol
bot.action('ulang_aduan', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    if (userState[userId]) {
        userState[userId].step = 4;
        return ctx.reply('Silakan pilih kembali Jenis Pengaduan (1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');
    }
    return ctx.reply('Sesi berakhir. Ketik /start untuk mulai kembali.');
});

bot.action('tutup_sesi', async (ctx) => {
    await ctx.answerCbQuery();
    delete userState[ctx.from.id];
    return ctx.editMessageText('Terima kasih telah berkontribusi untuk kemajuan Perpustakaan UNUJA.');
});

// 4. Export untuk Vercel
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error(err);
            res.status(200).send('OK');
        }
    } else {
        res.status(200).send('Bot Status: Online');
    }
};
