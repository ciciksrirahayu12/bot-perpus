import os, asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Mengambil data dari Environment Variables Vercel
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
                user_text = update.message.text
                user_name = update.message.from_user.first_name
                user_id = update.message.chat_id
                
                if user_text == "/start":
                    asyncio.run(bot.send_message(chat_id=user_id, text="Halo! Silakan ketik laporan pengaduan Anda di sini."))
                else:
                    # --- BAGIAN PENGIRIMAN KE ADMIN ---
                    pesan_untuk_admin = (
                        f"🚨 *ADA PENGADUAN BARU*\n\n"
                        f"👤 Dari: {user_name} ({user_id})\n"
                        f"📝 Laporan: {user_text}"
                    )
                    
                    # Kirim ke Admin
                    asyncio.run(bot.send_message(chat_id=ADMIN_ID, text=pesan_untuk_admin, parse_mode="Markdown"))
                    
                    # Balas ke User bahwa laporan terkirim
                    asyncio.run(bot.send_message(chat_id=user_id, text="✅ Laporan Anda sudah terkirim ke petugas. Terima kasih!"))
            
            return 'OK', 200
        except Exception as e:
            print(f"Error: {e}")
            return 'Error', 500
            
    return 'Bot Pengaduan Aktif', 200
