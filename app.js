const dateutil = require('./utils/dateutil');
const reqHelper = require('./utils/request-helper');
const constants = require('./utils/constants');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const ejs = require('ejs');

const resultsUrl = 'https://tools.traderslounge.in/fnoresults';

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';
const channelChatId = '-1001453070196';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    const bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/results (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const dateToCheck = match[1];
        var resultsDate;

        if (!dateToCheck || dateToCheck === 'today') {
            resultsDate = dateutil.getDate();
        } else {
            resultsDate = new Date(dateToCheck);
        }

        var message = await sendResultsMessage(chatId, resultsDate);
    });

    bot.onText(/\/help (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, constants.greeting);
    });

    res.render('index');
});


app.get('/checkResult', function (req, res) {
    var date = dateutil.getDate();
    // TODO: Check latest results.
    res.render('index');
});

app.get('/todayResults', async function (req, res) {
    var message = await sendResultsMessage(channelChatId, dateutil.getDate());
    res.render('index');
});

async function sendResultsMessage(chatId, dateToCheck) {
    const bot = new TelegramBot(token, { polling: true });
    var results = await reqHelper.downloadPage(resultsUrl, true);
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var resultsDate = new Date(result.date);
        if (resultsDate.getDate() == dateToCheck.getDate() && resultsDate.getMonth() == dateToCheck.getMonth() && resultsDate.getFullYear() == dateToCheck.getFullYear()) {
            var message = createMessage(result);
            bot.sendMessage(chatId, message);
            return;
        }
    }
    bot.sendMessage(chatId, 'No results on ' + dateutil.formatDate(dateToCheck));
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