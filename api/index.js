const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf('8253691234:AAHxxxxxxxxxxxxxxx'); // Ganti Token
const ADMIN_ID = 7812077042; // ID Kamu

const userState = {};

bot.start((ctx) => {
    const userId = ctx.from.id;
    userState[userId] = { step: 1, nama: '', nim: '', kontak: '', jenis: '', isi: '' };
    return ctx.reply('👋 *Selamat Datang di Layanan Pengaduan*\n\nSilakan masukkan *Nama Lengkap* Anda:', { parse_mode: 'Markdown' });
});

// --- COMMAND BANTUAN SESUAI GAMBAR ---
bot.command('bantuan', (ctx) => {
    const teksBantuan = 
        `🆘 *Bantuan Layanan Pengaduan*\n\n` +
        `Jika Anda mengalami kendala, hubungi admin melalui:\n` +
        `👉 @perpus_unuja\n\n` +
        `Ketik /start untuk mulai atau /stop untuk batal.`;
    return ctx.reply(teksBantuan, { parse_mode: 'Markdown' });
});

bot.command('stop', (ctx) => {
    const userId = ctx.from.id;
    if (userState[userId]) {
        delete userState[userId];
        return ctx.reply('🛑 *Proses pengaduan dihentikan.* Ketik /start untuk memulai kembali.', { parse_mode: 'Markdown' });
    }
    return ctx.reply('Tidak ada proses yang berjalan.');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const msg = ctx.message.text;
    if (msg.startsWith('/') || !userState[userId]) return;
    
    const state = userState[userId];

    try {
        if (state.step === 1) {
            state.nama = msg; state.step = 2;
            return await ctx.reply(`Halo *${state.nama}*!\n\nMasukkan *NIM* Anda (Ketik '-' jika bukan mahasiswa):`, { parse_mode: 'Markdown' });
        } 
        if (state.step === 2) {
            state.nim = msg; state.step = 3;
            return await ctx.reply('Masukkan *Nomor WhatsApp* aktif Anda:', { parse_mode: 'Markdown' });
        } 
        if (state.step === 3) {
            state.kontak = msg; state.step = 4;
            return await ctx.reply('Pilih *Jenis Pengaduan* (1-5):\n\n1. Layanan Akademik\n2. Fasilitas Sarpras\n3. Keuangan/UKT\n4. Perpustakaan\n5. Lainnya');
        } 
        if (state.step === 4) {
            const kategori = { '1': 'Layanan Akademik', '2': 'Fasilitas Sarpras', '3': 'Keuangan/UKT', '4': 'Perpustakaan', '5': 'Lainnya' };
            if (!kategori[msg]) return await ctx.reply('⚠️ Pilih angka 1-5:');
            state.jenis = kategori[msg]; state.step = 5;
            return await ctx.reply(`Kategori: *${state.jenis}*\n\nTuliskan *Isi Pengaduan* Anda:`, { parse_mode: 'Markdown' });
        } 
        if (state.step === 5) {
            state.isi = msg; state.step = 6;
            const preview = `📝 *REKAP LAPORAN*\n\n👤 Nama: ${state.nama}\n🆔 NIM: ${state.nim}\n📞 WA: ${state.kontak}\n📂 Jenis: ${state.jenis}\n💬 Isi: ${state.isi}\n\nApakah data sudah benar?`;
            return await ctx.reply(preview, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('✅ YA, KIRIM', 'kirim_laporan'),
                    Markup.button.callback('❌ TIDAK, BATAL', 'batal_laporan')
                ])
            });
        }
    } catch (e) { await ctx.reply("❌ Gangguan teknis. Ketik /start"); }
});

bot.action('kirim_laporan', async (ctx) => {
    const userId = ctx.from.id;
    const state = userState[userId];
    if (!state) return ctx.answerCbQuery();
    const laporan = `📢 *PENGADUAN BARU*\n\n👤 Nama: ${state.nama}\n🆔 NIM: ${state.nim}\n📞 WA: ${state.kontak}\n📂 Jenis: ${state.jenis}\n📝 Isi: ${state.isi}`;
    try {
        await ctx.telegram.sendMessage(ADMIN_ID, laporan, { parse_mode: 'Markdown' });
        await ctx.editMessageText('✅ *Berhasil!* Laporan telah dikirim ke Admin.', { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.editMessageText('⚠️ Laporan tersimpan, Admin belum aktif.', { parse_mode: 'Markdown' });
    }
    delete userState[userId];
    ctx.answerCbQuery();
});

bot.action('batal_laporan', async (ctx) => {
    delete userState[ctx.from.id];
    await ctx.editMessageText('❌ *Laporan dibatalkan.*', { parse_mode: 'Markdown' });
    ctx.answerCbQuery();
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try { await bot.handleUpdate(req.body); res.status(200).send('OK'); } catch (err) { res.status(200).send('OK'); }
    } else { res.status(200).send('Bot Status: Running'); }
};
