const dotenv = require('dotenv');
const express = require('express');
const ejs = require('ejs');

const bot = require('./bot/bot');
const dateUtil = require('./service/dateutil');
const resultsService = require('./service/results-service');
const TelegramBot = require('node-telegram-bot-api');

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
    var chatId = process.env.channelChatId;
    await resultsService.checkResults(bot, chatId, null);
    res.render('index');
});

app.get('/todayResults', async function (req, res) {
    const bot = new TelegramBot(process.env.token);
    var chatId = process.env.channelChatId;    
    await resultsService.sendResultsMessage(bot, chatId, dateUtil.getDate());
    res.render('index');
});

app.listen(PORT, function () {
    dotenv.config();
    if (!init) {
        bot.startBot();
        init = true;
    }
    console.log('Example app listening on port ' + PORT + '!');
});