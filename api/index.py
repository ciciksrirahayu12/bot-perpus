import os, asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        data = request.get_json(force=True)
        bot = Bot(token=TOKEN)
        update = Update.de_json(data, bot)
        
        if update.message and update.message.text:
            text = update.message.text
            chat_id = update.message.chat_id
            
            if text == "/start":
                asyncio.run(bot.send_message(chat_id=chat_id, text="Selamat datang! Silakan ketik: Nama, NIM, Kontak, dan Laporan Anda dalam SATU PESAN."))
            else:
                # Kirim langsung ke Admin
                laporan = f"🚨 PENGADUAN BARU\nDari ID: {chat_id}\nIsi: {text}"
                asyncio.run(bot.send_message(chat_id=ADMIN_ID, text=laporan))
                asyncio.run(bot.send_message(chat_id=chat_id, text="Laporan Anda sudah terkirim ke Admin. Terima kasih!"))
                
        return 'OK', 200
    return 'Bot Aktif', 200
