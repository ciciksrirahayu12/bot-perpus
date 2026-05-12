import os, asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Mengambil Token & Admin ID dari Environment Variables Vercel
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        try:
            update_json = request.get_json(force=True)
            bot = Bot(token=TOKEN)
            update = Update.de_json(update_json, bot)
            
            if update.message and update.message.text:
                chat_id = update.message.chat_id
                user_text = update.message.text
                user_name = update.message.from_user.first_name
                
                # 1. Balas ke User (Pandaan Terkirim)
                asyncio.run(bot.send_message(chat_id=chat_id, text="✅ Laporan Anda sudah diterima dan diteruskan ke petugas."))
                
                # 2. Teruskan ke Admin (Kamu)
                if ADMIN_ID:
                    laporan = f"🚨 *PENGADUAN BARU*\n\nDari: {user_name} ({chat_id})\nIsi: {user_text}"
                    asyncio.run(bot.send_message(chat_id=ADMIN_ID, text=laporan, parse_mode="Markdown"))
            
            return 'OK', 200
        except Exception as e:
            print(f"Error: {e}")
            return 'Error', 500
            
    return 'Bot Perpustakaan Aktif!', 200
