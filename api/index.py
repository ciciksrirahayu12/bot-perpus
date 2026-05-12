import os
import asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Ambil data dari Environment Variables
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

# Inisialisasi Bot secara global
bot = Bot(token=TOKEN)

async def handle_message(update):
    """Fungsi untuk memproses logika pesan"""
    if update.message and update.message.text:
        chat_id = update.message.chat_id
        text = update.message.text
        user = update.message.from_user

        # 1. Perintah /start
        if text == "/start":
            msg = (
                "📚 *Bot Pengaduan Perpustakaan UNUJA* 📚\n\n"
                "Kirim laporan dengan format:\n"
                "NAMA: \nNIM: \nKONTAK: \nJENIS: \nISI LAPORAN: "
            )
            await bot.send_message(chat_id=chat_id, text=msg, parse_mode="Markdown")
        
        # 2. Deteksi Format Laporan
        elif "NAMA:" in text.upper() and "ISI" in text.upper():
            # Balas ke User
            await bot.send_message(chat_id=chat_id, text="✅ Laporan diterima oleh Admin.")
            
            # Teruskan ke Admin
            if ADMIN_ID:
                report = f"🚨 *PENGADUAN BARU*\n\n{text}\n\n👤 Dari: {user.first_name}"
                await bot.send_message(chat_id=int(ADMIN_ID), text=report, parse_mode="Markdown")
        
        # 3. Pesan Lainnya
        else:
            await bot.send_message(chat_id=chat_id, text="⚠️ Gunakan format laporan atau ketik /start.")

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        try:
            update_json = request.get_json(force=True)
            update = Update.de_json(update_json, bot)
            
            # Menjalankan fungsi asinkron di dalam Flask secara aman
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(handle_message(update))
            loop.close()
            
            return 'OK', 200
        except Exception as e:
            print(f"Error detail: {e}")
            return str(e), 500
            
    return 'Bot Pengaduan UNUJA Ready', 200
