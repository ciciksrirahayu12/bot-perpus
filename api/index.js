const { Telegraf } = require('telegraf');
const bot = new Telegraf('8253691234:AAFf_L0O9ID-bHEvNSaFVxioCVg7Y9fZjEQ');

bot.start((ctx) => ctx.reply('ALHAMDULILLAH JALAN!'));
bot.on('text', (ctx) => ctx.reply('Bot menerima: ' + ctx.message.text));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) {
            res.status(200).send('Error');
        }
    } else {
        res.status(200).send('Bot Siap Menerima Pesan');
    }
};
