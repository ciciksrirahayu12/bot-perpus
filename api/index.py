import os
import asyncio
from flask import Flask, request
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters

TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

app = Flask(__name__)

# 1. Fungsi saat user klik START
async def start(update: Update, context):
    pesan_sambutan = (
        "Selamat Datang di Bot Pengaduan UNUJA!\n\n"
        "Silahkan kirimkan laporan Anda langsung di sini dengan format.\n\n"
        "NIM:\n\n"
        "Nama:\n\n"
        "Kontak (Telegram/WhatsApp):\n\n"
        "Isi Pengaduan:\n\n"
    )
    await update.message.reply_text(pesan_sambutan)

# 2. Fungsi saat user kirim LAPORAN (Pesan teks biasa)
async def handle_message(update: Update, context):
    user_text = update.message.text
    user_info = update.effective_user
    
    # Kirim ke Admin
    await context.bot.send_message(
        chat_id=ADMIN_ID,
        text=f"Laporan Baru!\nDari: {user_info.first_name} (@{user_info.username})\nIsi: {user_text}"
    )
    # Balasan ke User
    await update.message.reply_text("Laporan Anda telah diteruskan ke Admin. Terima kasih telah berkontribusi untuk kemajuan Perpustakaan UNUJA!")

@app.route('/', methods=['POST', 'GET'])
def main():
    if request.method == 'POST':
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        application = Application.builder().token(TOKEN).build()
        
        # Tambahkan perintah /start
        application.add_handler(CommandHandler("start", start))
        # Tambahkan penanganan pesan teks biasa (Laporan)
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        
        update = Update.de_json(request.get_json(force=True), application.bot)
        loop.run_until_complete(application.process_update(update))
        return "OK", 200
    return "Bot Pengaduan UNUJA Ready"
