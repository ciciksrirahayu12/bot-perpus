import os
import asyncio
from flask import Flask, request
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ConversationHandler,
    ContextTypes,
)

app = Flask(__name__)

# Ambil Token dan Admin ID dari Vercel
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

# Definisi tahapan percakapan
NAMA, NIM, KONTAK, JENIS, ISI = range(5)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "Selamat datang di Bot Pengaduan Perpustakaan UNUA.\n\n"
        "Silakan masukkan **Nama Lengkap** Anda:"
    )
    return NAMA

async def get_nama(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['nama'] = update.message.text
    await update.message.reply_text(f"Salam kenal {update.message.text}!\nSelanjutnya, masukkan **NIM** Anda:")
    return NIM

async def get_nim(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['nim'] = update.message.text
    await update.message.reply_text("Masukkan **Nomor Kontak/WhatsApp** yang dapat dihubungi:")
    return KONTAK

async def get_kontak(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['kontak'] = update.message.text
    
    # Membuat pilihan jenis pengaduan agar user tidak bingung
    reply_keyboard = [['Fasilitas', 'Layanan', 'Koleksi Buku', 'Lainnya']]
    await update.message.reply_text(
        "Pilih **Jenis Pengaduan** Anda:",
        reply_markup=ReplyKeyboardMarkup(reply_keyboard, one_time_keyboard=True, resize_keyboard=True),
    )
    return JENIS

async def get_jenis(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['jenis'] = update.message.text
    await update.message.reply_text("Terakhir, tuliskan **Isi Pengaduan** Anda secara detail:", reply_markup=ReplyKeyboardRemove())
    return ISI

async def get_isi_dan_kirim(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_data = context.user_data
    isi_laporan = update.message.text
    user = update.message.from_user

    # Susun pesan untuk Admin
    laporan_final = (
        f"🚨 *PENGADUAN BARU - UNUA*\n\n"
        f"👤 *Nama:* {user_data['nama']}\n"
        f"🆔 *NIM:* {user_data['nim']}\n"
        f"📞 *Kontak:* {user_data['kontak']}\n"
        f"📂 *Jenis:* {user_data['jenis']}\n"
        f"📝 *Isi:* {isi_laporan}\n\n"
        f"Username: @{user.username or 'Tidak ada'}"
    )

    # Kirim ke Admin
    await context.bot.send_message(chat_id=ADMIN_ID, text=laporan_final, parse_mode="Markdown")
    
    # Balas ke User
    await update.message.reply_text("Terima kasih! Laporan Anda telah kami terima dan akan segera diproses oleh petugas Perpustakaan UNUA.")
    return ConversationHandler.END

async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Proses pengaduan dibatalkan.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END

async def handle_update(update_json):
    application = Application.builder().token(TOKEN).build()

    conv_handler = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            NAMA: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_nama)],
            NIM: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_nim)],
            KONTAK: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_kontak)],
            JENIS: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_jenis)],
            ISI: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_isi_dan_kirim)],
        },
        fallbacks=[CommandHandler("cancel", cancel), CommandHandler("stop", cancel)],
    )

    application.add_handler(conv_handler)
    
    async with application:
        update = Update.de_json(update_json, application.bot)
        await application.process_update(update)

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        asyncio.run(handle_update(request.get_json(force=True)))
        return 'OK', 200
    return 'Bot UNUA Aktif', 200
