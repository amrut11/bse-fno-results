const dateutil = require('./utils/dateutil');
const reqHelper = require('./utils/request-helper');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const ejs = require('ejs');

const resultsUrl = 'https://tools.traderslounge.in/fnoresults';

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';
const channelChatId = '-1001453070196';
const bot = new TelegramBot(token, { polling: true });

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, 'I don\'t do anything. Join https://t.me/joinchat/AAAAAFacF3TKxasORZyjpQ');
    });
    res.render('index');
});


app.get('/checkResult', function (req, res) {
    var date = dateutil.getDate();
    // TODO: Check latest results.
    res.render('index');
});

app.get('/todayResults', async function (req, res) {
    var results = await reqHelper.downloadPage(resultsUrl, true);
    sendTodayResults(results);
    res.render('index');
});

function sendTodayResults(results) {
    var nowDate = dateutil.getDate();
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var resultsDate = new Date(result.date);
        if (resultsDate.getDate() == nowDate.getDate() && resultsDate.getMonth() == nowDate.getMonth() && resultsDate.getFullYear() == nowDate.getFullYear()) {
            var message = createMessage(result);
            bot.sendMessage(channelChatId, message);
            return;
        }
    }
    bot.sendMessage(channelChatId, 'No results on ' + nowDate);
}

function createMessage(result) {
    var message = result.title + '\n';
    var symbols = result.Symbol;
    for (var i = 0; i < symbols.length; i++) {
        message += symbols[i] + '\n';
    }
    return message;
}

app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!');
});