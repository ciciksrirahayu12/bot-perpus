const { Telegraf } = require('telegraf');

// 1. Inisialisasi Bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// 2. ID Admin (Gunakan ID yang sudah dipastikan klik /start)
const ADMIN_ID = 7812077042; 

const userState = {};

bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
    return ctx.reply('👋 Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan masukkan *Nama Lengkap* Anda:', { parse_mode: 'Markdown' });
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
                return await ctx.reply(`Halo ${state.nama}!\n\nSelanjutnya, masukkan *NIM* Anda (Ketik '-' jika bukan mahasiswa):`, { parse_mode: 'Markdown' });

            case 2:
                state.nim = msg;
                state.step = 3;
                return await ctx.reply('Masukkan *Nomor WhatsApp* Anda yang aktif:', { parse_mode: 'Markdown' });

            case 3:
                state.kontak = msg;
                state.step = 4;
                return await ctx.reply(
                    'Pilih *Jenis Pengaduan* (Ketik angka 1-5):\n\n1️⃣ Layanan\n2️⃣ Koleksi\n3️⃣ Fasilitas\n4️⃣ Sistem\n5️⃣ Lainnya',
                    { parse_mode: 'Markdown' }
                );

            case 4:
                const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };
                if (!kategori[msg]) {
                    return await ctx.reply('⚠️ Mohon masukkan angka 1 sampai 5 saja.');
                }
                state.jenis = kategori[msg];
                state.step = 5;
                return await ctx.reply(`Jenis: *${state.jenis}*\n\nTerakhir, silakan tuliskan *Isi Pengaduan* Anda secara detail:`, { parse_mode: 'Markdown' });

            case 5:
                state.isi = msg;
                state.tiketId = `LP-${Date.now()}`;
                await ctx.reply("⏳ Sedang meneruskan laporan Anda ke admin...");

                const pesanUntukAdmin = 
                    `📢 *PENGADUAN BARU*\n\n` +
                    `🎫 *Tiket:* #${state.tiketId}\n` +
                    `👤 *Nama:* ${state.nama}\n` +
                    `🆔 *NIM:* ${state.nim}\n` +
                    `📞 *Kontak:* ${state.kontak}\n` +
                    `📂 *Jenis:* ${state.jenis}\n` +
                    `📝 *Isi:* ${state.isi}\n\n` +
                    `📅 _Waktu: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`;

                try {
                    await ctx.telegram.sendMessage(ADMIN_ID, pesanUntukAdmin, { parse_mode: 'Markdown' });
                    delete userState[userId];
                    return await ctx.reply(
                        `✅ *Laporan Berhasil Terkirim!*\n\nNomor Tiket: \`${state.tiketId}\`\n\nAda lagi yang ingin diadukan?`, 
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: 'Ya, Lapor Lagi', callback_data: 'ulang' }, { text: 'Tidak, Terima Kasih', callback_data: 'tutup' }]
                                ]
                            }
                        }
                    );
                } catch (adminErr) {
                    return await ctx.reply(`❌ *Gagal ke Admin*\nDetail: \`${adminErr.message}\``);
                }
        }
    } catch (err) {
        return await ctx.reply("❌ Terjadi kesalahan sistem.");
    }
});

bot.action('ulang', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    userState[userId] = { step: 1 }; // Reset ke awal jika ingin lapor lagi
    return ctx.reply('Silakan masukkan *Nama Lengkap* Anda:', { parse_mode: 'Markdown' });
});

bot.action('tutup', async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.editMessageText('🙏 Terima kasih telah menghubungi layanan Perpustakaan UNUJA.');
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
