const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const ejs = require('ejs');

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
    const bot = new TelegramBot(token, { polling: true });
    bot.sendMessage(channelChatId, 'Today\'s Expected Results'); // TODO: Replace with stocks for the day.

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'I don\'t do anything. Join https://t.me/joinchat/AAAAAFacF3TKxasORZyjpQ');
    });

    res.render('index');
});

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';
const channelChatId = '-1001453070196';

app.get('/checkResult', function (req, res) {
    const bot = new TelegramBot(token, { polling: true });
    var date = new Date();
    bot.sendMessage(channelChatId, 'As of ' + date + ' no results.'); // TODO: Replace with latest results.
    res.render('index');
});

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!');
});