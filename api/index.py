import os, asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        try:
            # 1. Terima data dari Telegram
            data = request.get_json(force=True)
            bot = Bot(token=TOKEN)
            update = Update.de_json(data, bot)
            
            if update.message and update.message.text:
                chat_id = update.message.chat_id
                pesan_user = update.message.text
                
                # 2. Balas ke User
                asyncio.run(bot.send_message(chat_id=chat_id, text="Laporan diterima! Sedang diteruskan ke Admin."))
                
                # 3. Teruskan ke Kamu (Admin)
                if ADMIN_ID:
                    info = f"🚨 LAPORAN BARU\nDari: {chat_id}\nIsi: {pesan_user}"
                    asyncio.run(bot.send_message(chat_id=ADMIN_ID, text=info))
            
            return 'OK', 200
        except Exception as e:
            return str(e), 500
    return 'Bot UNUA Aktif!', 200
