const dateutil = require('./utils/dateutil');
const reqHelper = require('./utils/request-helper');

const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const express = require('express');
const ejs = require('ejs');

const GREETING = 'Join https://t.me/joinchat/AAAAAFacF3TKxasORZyjpQ';

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static('public'));
app.set('view engine', 'ejs');

var init = false;

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/startBot', function (req, res) {
    if (!init) {
        startBot();
        init = true;
    }
    res.render('index');
});

app.get('/checkResult', async function (req, res) {
    const bot = new TelegramBot(process.env.token);
    await checkResults(bot, process.env.channelChatId, process.env.INTERVAL, false);
    res.render('index');
});

app.get('/todayResults', async function (req, res) {
    const bot = new TelegramBot(process.env.token);
    await sendResultsMessage(bot, process.env.channelChatId, dateutil.getDate());
    res.render('index');
});

async function checkResults(bot, chatId, interval, emptyMessage) {
    var date = dateutil.getDate();
    var todayDate = dateutil.formatTodayDate(date);
    var resultsApi = process.env.bseResultsApi.replace('{startDate}', todayDate).replace('{endDate}', todayDate);
    var currentResults = await reqHelper.downloadPage(resultsApi, true);
    var resultsTable = currentResults.Table;
    var resultsFound = false;
    for (var i = 0; i < resultsTable.length; i++) {
        var result = resultsTable[i];
        var scripId = result.SCRIP_CD;
        if (!process.env.fnoScriptIDs.includes(scripId)) {
            continue;
        }
        var resultDate = new Date(result.NEWS_DT);
        var diff = (date.getTime() - resultDate.getTime()) / 1000 / 60;
        if (diff > 0 && diff < interval) {
            resultsFound = true;
            var message = '*Results out!*\n----------------------\nScrip: *' + result.SLONGNAME +
                '*\nTime: ' + dateutil.formatTimeDate(resultDate) + '\nNews: ' + result.NEWSSUB;
            bot.sendMessage(chatId, message, { parse_mode: "markdown" });
        }
    }
    if (!resultsFound && emptyMessage) {
        bot.sendMessage(chatId, 'No results today in last ' + interval + ' minutes.');
    }
}

async function sendResultsMessage(bot, chatId, dateToCheck) {
    var results = await reqHelper.downloadPage(process.env.fnoResultsUrl, true);
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var resultsDate = new Date(result.date);
        if (dateutil.isSameDate(resultsDate, dateToCheck)) {
            var message = createMessage(result);
            bot.sendMessage(chatId, message, { parse_mode: 'markdown' });
            return;
        }
    }
    bot.sendMessage(chatId, 'No results on ' + dateutil.formatDate(dateToCheck));
}

function createMessage(result) {
    var message = '*' + result.title + '*\n-----------------------------------\n';
    var symbols = result.Symbol;
    for (var i = 0; i < symbols.length; i++) {
        message += symbols[i] + '\n';
    }
    return message;
}

async function sendAtr(bot, chatId, stockSymbol, dateToCheck) {
    var atrUrl = process.env.atrApi.replace('{symbol}', stockSymbol).replace('{alphavantageKey}', process.env.alphavantageKey);
    var response = await reqHelper.downloadPage(atrUrl, true);
    var atrJson = response['Technical Analysis: ATR'];
    if (atrJson) {
        for (var k in atrJson) {
            var atrDate = new Date(k);
            if (dateutil.isSameDate(atrDate, dateToCheck)) {
                var message = 'ATR for ' + stockSymbol + ' as of ' + k + ' is ' + atrJson[k].ATR;
                bot.sendMessage(chatId, message);
                return;
            }
        }
    }
    bot.sendMessage(chatId, 'No data found');
}

function startBot() {
    const bot = new TelegramBot(process.env.token, { polling: true });

    bot.onText(/results (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const dateToCheck = match[1];
        var resultsDate;

        if (!dateToCheck || dateToCheck === 'today') {
            resultsDate = dateutil.getDate();
        } else {
            resultsDate = new Date(dateToCheck);
        }

        await sendResultsMessage(bot, chatId, resultsDate);
    });

    bot.onText(/check (.+)/, async (msg, match) => {
        var chatId = msg.chat.id;
        const interval = match[1];
        await checkResults(bot, chatId, interval, true);
    });

    bot.onText(/help (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, GREETING);
    });

    bot.onText(/atr (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        const input = match[1].split(' ');
        const stockSymbol = input[0];
        var dateToCheck = input[1] ? new Date(input[1]) : new Date();
        await sendAtr(bot, chatId, stockSymbol, dateToCheck);
    });
}

app.listen(PORT, function () {
    dotenv.config();
    if (!init) {
        startBot();
        init = true;
    }
    console.log('Example app listening on port ' + PORT + '!');
});