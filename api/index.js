const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = 7812077042; // ID Admin kamu
const userState = {};

bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1 };
    return ctx.reply('Selamat Datang di Bot Pengaduan Perpustakaan UNUJA\n\nSilakan ketik Nama Lengkap Anda:');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;

    // Abaikan jika command atau user tidak dalam sesi aktif
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
                return await ctx.reply('Tuliskan nomor WhatsApp yang bisa dihubungi:');

            case 3:
                state.kontak = msg;
                state.step = 4;
                return await ctx.reply('Pilih Jenis Pengaduan (1-5):\n1. Layanan\n2. Koleksi\n3. Fasilitas\n4. Sistem\n5. Lainnya');

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

                // Bagian kirim ke Admin
                const laporan = `📢 PENGADUAN BARU\n🎫 Tiket: #${state.tiketId}\n👤 Nama: ${state.nama}\n🆔 NIM: ${state.nim}\n📞 Kontak: ${state.kontak}\n📂 Jenis: ${state.jenis}\n📝 Isi: ${state.isi}`;

                try {
                    await ctx.telegram.sendMessage(ADMIN_ID, laporan);
                } catch (e) {
                    console.error("Gagal kirim ke admin:", e.message);
                }

                delete userState[userId]; // Selesai, hapus state
                return await ctx.reply(`✅ Laporan Terkirim!\nNomor Tiket: ${state.tiketId}`);
        }
    } catch (err) {
        console.error(err);
        return ctx.reply('Terjadi kesalahan teknis. Ketik /start untuk mencoba lagi.');
    }
});

// Handler Vercel
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
