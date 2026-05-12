import os
import asyncio
from flask import Flask, request
from telegram import Update, ReplyKeyboardMarkup, ReplyKeyboardRemove
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ConversationHandler

app = Flask(__name__)

# Ambil Token dan Admin ID
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

# Tahapan percakapan
NAMA, NIM, KONTAK, JENIS, ISI = range(5)

# Fungsi Handler
async def start(update, context):
    await update.message.reply_text("Selamat datang di Bot UNUA. Silakan masukkan **Nama Lengkap** Anda:")
    return NAMA

async def get_nama(update, context):
    context.user_data['nama'] = update.message.text
    await update.message.reply_text("Masukkan **NIM** Anda:")
    return NIM

async def get_nim(update, context):
    context.user_data['nim'] = update.message.text
    await update.message.reply_text("Masukkan **Nomor WhatsApp**:")
    return KONTAK

async def get_kontak(update, context):
    context.user_data['kontak'] = update.message.text
    keys = [['Fasilitas', 'Layanan'], ['Koleksi Buku', 'Lainnya']]
    await update.message.reply_text("Pilih **Jenis Pengaduan**:", 
        reply_markup=ReplyKeyboardMarkup(keys, one_time_keyboard=True, resize_keyboard=True))
    return JENIS

async def get_jenis(update, context):
    context.user_data['jenis'] = update.message.text
    await update.message.reply_text("Tuliskan **Isi Pengaduan** Anda:", reply_markup=ReplyKeyboardRemove())
    return ISI

async def get_isi_akhir(update, context):
    ud = context.user_data
    pesan_admin = (f"🚨 *LAPORAN BARU*\n\n👤 Nama: {ud['nama']}\n🆔 NIM: {ud['nim']}\n"
                   f"📞 WA: {ud['kontak']}\n📂 Jenis: {ud['jenis']}\n📝 Isi: {update.message.text}")
    
    await context.bot.send_message(chat_id=ADMIN_ID, text=pesan_admin, parse_mode="Markdown")
    await update.message.reply_text("Terima kasih! Laporan telah diteruskan ke petugas.")
    return ConversationHandler.END

async def cancel(update, context):
    await update.message.reply_text("Dibatalkan.", reply_markup=ReplyKeyboardRemove())
    return ConversationHandler.END

# Fungsi Utama untuk Vercel
async def main_process(update_json):
    # Inisialisasi Application di dalam fungsi agar fresh setiap request
    application = Application.builder().token(TOKEN).build()
    
    conv = ConversationHandler(
        entry_points=[CommandHandler("start", start)],
        states={
            NAMA: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_nama)],
            NIM: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_nim)],
            KONTAK: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_kontak)],
            JENIS: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_jenis)],
            ISI: [MessageHandler(filters.TEXT & ~filters.COMMAND, get_isi_akhir)],
        },
        fallbacks=[CommandHandler("stop", cancel)],
    )
    
    application.add_handler(conv)
    
    async with application:
        update = Update.de_json(update_json, application.bot)
        await application.process_update(update)

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        try:
            asyncio.run(main_process(request.get_json(force=True)))
        except Exception as e:
            print(f"Error: {e}")
        return 'OK', 200
    return 'Bot Aktif', 200
