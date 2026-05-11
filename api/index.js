const { Telegraf } = require('telegraf');

// 1. Pastikan Token di Vercel sudah benar
const bot = new Telegraf(process.env.BOT_TOKEN);

// 2. ID Admin (Akun yang akan menerima laporan)
const ADMIN_ID = 7812077042; 

// Penyimpanan sementara data user
const userState = {};

// --- COMMAND START ---
bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
    return ctx.reply('👋 Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan masukkan *Nama Lengkap* Anda:', { parse_mode: 'Markdown' });
});

// --- HANDLING TEKS ---
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;

    // Abaikan jika pesan adalah perintah atau user tidak dalam sesi lapor
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
                    'Pilih *Jenis Pengaduan* (Ketik angka 1-5):\n\n' +
                    '1️⃣ Layanan\n' +
                    '2️⃣ Koleksi\n' +
                    '3️⃣ Fasilitas\n' +
                    '4️⃣ Sistem\n' +
                    '5️⃣ Lainnya', 
                    { parse_mode: 'Markdown' }
                );

            case 4:
                const kategori = { '1': 'Layanan', '2': 'Koleksi', '3': 'Fasilitas', '4': 'Sistem', '5': 'Lainnya' };
                if (!kategori[msg]) {
                    return await ctx.reply('⚠️ Mohon masukkan angka 1 sampai 5 saja sesuai pilihan di atas.');
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
                    // KIRIM KE ADMIN (Kuncinya di sini)
                    await ctx.telegram.sendMessage(ADMIN_ID, pesanUntukAdmin, { parse_mode: 'Markdown' });
                    
                    // Hapus sesi jika berhasil
                    delete userState[userId];

                    return await ctx.reply(
                        `✅ *Laporan Berhasil Terkirim!*\n\nNomor Tiket Anda: \`${state.tiketId}\`\n\nApakah ada hal lain yang ingin diadukan?`, 
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        { text: 'Ya, Lapor Lagi', callback_data: 'ulang' },
                                        { text: 'Tidak, Terima Kasih', callback_data: 'tutup' }
                                    ]
                                ]
                            }
                        }
                    );
                } catch (adminErr) {
                    console.error("Gagal kirim ke admin:", adminErr.message);
                    return await ctx.reply(`❌ *Gagal Terkirim ke Admin*\n\nDetail Error: \`${adminErr.message}\`\n\nPastikan ID Admin sudah menekan /start di bot ini.`);
                }
        }
    } catch (err) {
        console.error("System Error:", err);
        return await ctx.reply("❌ Terjadi kesalahan sistem. Silakan coba lagi nanti.");
    }
});

// --- HANDLING BUTTONS ---
bot.action('ulang', async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;
    userState[userId] = { step: 4 }; // Langsung balik ke pilih jenis agar praktis
    return ctx.reply('Silakan pilih kembali *Jenis Pengaduan* (1-5):', { parse_mode: 'Markdown' });
});

bot.action('tutup', async (ctx) => {
    await ctx.answerCbQuery();
    delete userState[ctx.from.id];
    return ctx.editMessageText('🙏 Terima kasih telah menggunakan layanan pengaduan Perpustakaan UNUJA.');
});

// --- EXPORT UNTUK VERCEL ---
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            console.error("Webhook Error:", err);
            res.status(200).send('OK');
        }
    } else {
        res.status(200).send('<h1>Bot is Running</h1>');
    }
};
