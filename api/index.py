import os
import telebot
from flask import Flask, request

# Ambil variabel dari Vercel
TOKEN = os.getenv("TELEGRAM_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID")

bot = telebot.TeleBot(TOKEN)
app = Flask(__name__)

# 1. Respon saat klik START
@bot.message_handler(commands=['start'])
def send_welcome(message):
    pesan = (
        "Selamat Datang di Bot Pengaduan UNUJA!\n\n"
        "Silahkan kirimkan laporan Anda langsung di sini dengan format.\n\n"
        "NIM:\n"
        "Nama:\n"
        "Kontak (Telegram/WhatsApp):\n"
        "Isi Pengaduan:\n"
    )
    bot.reply_to(message, pesan)

# 2. Respon saat kirim LAPORAN
@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    # Kirim ke Admin
    bot.send_message(
        ADMIN_ID, 
        f"Laporan Baru!\nDari: {message.from_user.first_name} (@{message.from_user.username})\nIsi: {message.text}"
    )
    # Balasan ke User
    bot.reply_to(message, "Laporan Anda telah diteruskan ke Admin. Terima kasih telah berkontribusi untuk kemajuan Perpustakaan UNUJA!")

@app.route('/', methods=['POST', 'GET'])
def webhook():
    if request.method == 'POST':
        update = telebot.types.Update.de_json(request.stream.read().decode("utf-8"))
        bot.process_new_updates([update])
        return "OK", 200
    return "Bot Pengaduan UNUJA Aktif", 200
