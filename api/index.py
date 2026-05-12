import os
import asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Ambil Token & Admin ID
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

@app.route('/', methods=['POST', 'GET'])
def index():
    if request.method == 'POST':
        # Gunakan bot dasar tanpa Handler ribet dulu untuk tes
        update_json = request.get_json(force=True)
        bot = Bot(token=TOKEN)
        update = Update.de_json(update_json, bot)
        
        if update.message:
            chat_id = update.message.chat_id
            text = update.message.text
            
            # Balasan otomatis untuk tes nyawa bot
            asyncio.run(bot.send_message(chat_id=chat_id, text=f"Bot Hidup! Kamu mengirim: {text}"))
            
            # Kirim notif ke Admin (kamu)
            if ADMIN_ID:
                asyncio.run(bot.send_message(chat_id=ADMIN_ID, text=f"Notif Admin: Ada pesan masuk dari {chat_id}"))
                
        return 'OK', 200
    return 'Bot UNUA siap!', 200
