import os
import asyncio
from flask import Flask, request
from telegram import Update, Bot
from telegram.ext import Application, CommandHandler, MessageHandler, filters

app = Flask(__name__)

# Ambil Token dan Admin ID
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

async def handle_update(update_json):
    # Inisialisasi Application secara lokal setiap ada request
    application = Application.builder().token(TOKEN).build()
    
    # Fungsi untuk start
    async def start(update, context):
        await update.message.reply_text("Selamat Datang Di Bot Perpustakaan UNUJA. Silahkan Tuliskan Pengaduan Anda dengan mencantumkan kontak yang dapat dihubungi.")

    # Fungsi untuk kirim laporan ke Admin
    async def report(update, context):
        user = update.message.from_user
        text = update.message.text
        
        # Pesan untuk Admin
        admin_msg = f"🚨 *LAPORAN BARU*\n\n👤 Dari: {user.first_name}\n📝 Isi: {text}"
        
        # Kirim ke Admin
        await context.bot.send_message(chat_id=ADMIN_ID, text=admin_msg, parse_mode="Markdown")
        # Balas ke User
        await update.message.reply_text("Laporan sudah diterima admin. Terima kasih!")

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, report))
    
    async with application:
        update = Update.de_json(update_json, application.bot)
        await application.process_update(update)

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        asyncio.run(handle_update(request.get_json(force=True)))
        return 'OK', 200
    return 'Bot is Online', 200
