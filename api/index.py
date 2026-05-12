import os, asyncio
from flask import Flask, request
from telegram import Update, Bot

app = Flask(__name__)

# Ambil data dari Environment Variables Vercel
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
                text = update.message.text
                user = update.message.from_user

                # Perintah Start
                if text == "/start":
                    welcome_msg = (
                        "📚 *Bot Pengaduan Perpustakaan UNUJA* 📚\n\n"
                        "Untuk mengirim laporan, silakan kirim *SATU PESAN* dengan format:\n"
                        "---------------------------\n"
                        "NAMA: \n"
                        "NIM: \n"
                        "KONTAK: \n"
                        "JENIS: \n"
                        "ISI LAPORAN: \n"
                        "---------------------------\n"
                        "Admin akan segera merespons laporan Anda."
                    )
                    asyncio.run(bot.send_message(chat_id=chat_id, text=welcome_msg, parse_mode="Markdown"))
                
                # Deteksi jika pesan mengandung format laporan
                elif "NAMA:" in text.upper() and "ISI" in text.upper():
                    # 1. Balas ke User
                    asyncio.run(bot.send_message(chat_id=chat_id, text="✅ Laporan Anda telah diterima oleh Admin. Terima kasih!"))
                    
                    # 2. Teruskan ke Admin (Kamu)
                    if ADMIN_ID:
                        report_to_admin = (
                            "🚨 *PENGADUAN BARU*\n\n"
                            f"{text}\n\n"
                            f"👤 *Dari:* {user.first_name} (@{user.username})\n"
                            f"🆔 *Chat ID:* `{chat_id}`"
                        )
                        asyncio.run(bot.send_message(chat_id=int(ADMIN_ID), text=report_to_admin, parse_mode="Markdown"))
                
                # Jika user hanya chat biasa (bukan format laporan)
                else:
                    asyncio.run(bot.send_message(chat_id=chat_id, text="⚠️ Mohon gunakan format laporan yang benar atau ketik /start untuk melihat bantuan."))

            return 'OK', 200
        except Exception as e:
            print(f"Error: {e}")
            return 'Error', 500
            
    return 'Bot Pengaduan Tanpa GSheet Aktif', 200
