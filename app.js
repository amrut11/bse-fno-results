const dateutil = require('./utils/dateutil');
const reqHelper = require('./utils/request-helper');
const dbService = require('./utils/db-service');

const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const express = require('express');
const ejs = require('ejs');

const GREETING = 'Join https://t.me/joinchat/AAAAAFacF3TKxasORZyjpQ';

const HTTP = 'HTTP';
const BOT = 'BOT';

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
    audit(HTTP, 'checkResult', null);
    const bot = new TelegramBot(process.env.token);
    await checkResults(bot, process.env.channelChatId, null);
    res.render('index');
});

app.get('/todayResults', async function (req, res) {
    audit(HTTP, 'todayResults', null);
    const bot = new TelegramBot(process.env.token);
    await sendResultsMessage(bot, process.env.channelChatId, dateutil.getDate());
    res.render('index');
});

async function checkResults(bot, chatId, interval) {
    var todayDate = dateutil.getDate();
    var todayDateFormatted = dateutil.formatTodayDate(todayDate);
    var resultsApi = process.env.bseResultsApi.replace('{startDate}', todayDateFormatted).replace('{endDate}', todayDateFormatted);
    var currentResults = await reqHelper.downloadPage(resultsApi, true);
    var resultsTable = currentResults.Table;
    var resultsFound = false;
    for (var i = 0; i < resultsTable.length; i++) {
        var result = resultsTable[i];
        var scripId = result.SCRIP_CD;
        var scripName = result.SLONGNAME;
        var resultDate = new Date(result.NEWS_DT);
        var resultNews = result.NEWSSUB;
        if (!process.env.fnoScriptIDs.includes(scripId)) {
            continue;
        }
        var resultNotified = await updateDatabase(scripId, scripName, resultDate.getTime(), resultNews);
        var notify = !resultNotified;
        if (interval) {
            var diff = (todayDate.getTime() - resultDate.getTime()) / 1000 / 60;
            notify = diff > 0 && diff < interval;
        }
        if (notify) {
            resultsFound = true;
            var message = createAnnouncedMessage(scripName, resultDate, resultNews);
            bot.sendMessage(chatId, message, { parse_mode: "markdown" });
        }
    }
    if (!resultsFound && interval) {
        bot.sendMessage(chatId, 'No results today in last ' + interval + ' minutes.');
    }
}

async function updateDatabase(scripId, scripName, resultTime, resultNews) {
    var resultExists = await checkResultExists(scripId, resultTime);
    if (!resultExists) {
        var now = Date.now() / 1000;
        var sql = `insert into fno_results values ('${scripId}', '${scripName}', to_timestamp(${resultTime / 1000}), '${resultNews}', to_timestamp(${now}))`;
        await dbService.runSql(sql);
    }
    return resultExists;
}

function audit(source, endpoint, chatId) {
    var sql = `insert into fno_audit values (to_timestamp(${Date.now() / 1000}), '${source}', '${endpoint}', '${chatId}')`;
    dbService.runSql(sql);
}

async function checkResultExists(scripId, resultTime) {
    var sql = `select scrip_id from fno_results where scrip_id = '${scripId}' and result_time = to_timestamp(${resultTime / 1000})`;
    var result = await dbService.runSql(sql);
    return result && result.length > 0;
}

async function sendResultsMessage(bot, chatId, dateToCheck) {
    var results = await reqHelper.downloadPage(process.env.fnoResultsUrl, true);
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var resultsDate = new Date(result.date);
        if (dateutil.isSameDate(resultsDate, dateToCheck)) {
            var message = createDailyResultMessage(result);
            bot.sendMessage(chatId, message, { parse_mode: 'markdown' });
            return;
        }
    }
    bot.sendMessage(chatId, 'No results on ' + dateutil.formatDate(dateToCheck));
}

function createDailyResultMessage(result) {
    var message = '*' + result.title + '*\n-----------------------------------\n';
    var symbols = result.Symbol;
    symbols.forEach(symbol => {
        if (process.env.fnoScripNames.includes(symbol)) {
            message += symbol + '\n';
        }
    });
    return message;
}

async function sendAnnouncedMessage(bot, chatId, dateToCheck) {
    var sql = `select * from fno_results where DATE(result_time) = DATE('${dateutil.formatTodayDate(dateToCheck)}') order by result_time`;
    var results = await dbService.runSql(sql);
    if (results && results.length > 0) {
        var message = '';
        results.forEach(result => {
            var resultDate = new Date(result.result_time);
            message += createAnnouncedMessage(result.scrip_name, resultDate, null) + '\n';
        });
        bot.sendMessage(chatId, message, { parse_mode: 'markdown' });
    } else {
        bot.sendMessage(chatId, 'No results on ' + dateutil.formatDate(dateToCheck));
    }
}

function createAnnouncedMessage(scripName, resultDate, resultNews) {
    var message = '';
    if (resultNews) {
        message += '*Results out!*\n----------------------\n';
    }
    message += '*Stock*: *' + scripName + '*\n*Time*: ' + dateutil.formatTimeDate(resultDate);
    if (resultNews) {
        message += '\n*News*: ' + resultNews
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

    bot.onText(/[Rr]esults (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        audit(BOT, 'results ' + match[1], chatId);
        var resultsDate = getDateFromMessage(match[1]);
        await sendResultsMessage(bot, chatId, resultsDate);
    });

    bot.onText(/[Aa]nnounced (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        audit(BOT, 'announced ' + match[1], chatId);
        var resultsDate = getDateFromMessage(match[1]);
        await sendAnnouncedMessage(bot, chatId, resultsDate);
    });

    bot.onText(/[Cc]heck (.+)/, async (msg, match) => {
        var chatId = msg.chat.id;
        audit(BOT, 'check ' + match[1], chatId);
        const interval = match[1];
        await checkResults(bot, chatId, interval);
    });

    bot.onText(/[Hh]elp (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        audit(BOT, 'help ' + match[1], chatId);
        bot.sendMessage(chatId, GREETING);
    });

    bot.onText(/[Aa]tr (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        audit(BOT, 'atr ' + match[1], chatId);
        const input = match[1].split(' ');
        const stockSymbol = input[0];
        var dateToCheck = getDateFromMessage(input[1]);
        await sendAtr(bot, chatId, stockSymbol, dateToCheck);
    });
}

function getDateFromMessage(dateToCheck) {
    var resultsDate;
    if (dateToCheck === 'today') {
        resultsDate = dateutil.getDate();
    } else if (dateToCheck === 'yesterday') {
        resultsDate = dateutil.getYesterdayDate();
    } else if (dateToCheck === 'tomorrow') {
        resultsDate = dateutil.getTomorrowDate();
    } else {
        resultsDate = new Date(dateToCheck);
    }
    return resultsDate;
}

app.listen(PORT, function () {
    dotenv.config();
    if (!init) {
        startBot();
        init = true;
    }
    console.log('Example app listening on port ' + PORT + '!');
});