const dbService = require('../service/db-service');
const resultsService = require('../service/results-service');
const atrService = require('../service/atr-service');
const dateUtil = require('../service/dateutil');
const TelegramBot = require('node-telegram-bot-api');

const GREETING = 'Join http://tiny.cc/BseFnoResultsAlert';

const BOT = 'BOT';

function startBot() {
    const bot = new TelegramBot(process.env.token, { polling: true });

    bot.onText(/[Rr]esults (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        dbService.audit(BOT, 'results ' + match[1], chatId);
        if (!process.env.authorisedUsers.includes(chatId)) {
            bot.sendMessage(chatId, 'Sorry. You\'re not authorised to use this. Please contact @NFOResult if you require access.');
            return;
        }
        var resultsDate = dateUtil.getDateFromMessage(match[1]);
        await resultsService.sendResultsMessage(bot, chatId, resultsDate);
    });

    bot.onText(/[Aa]nnounced (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        dbService.audit(BOT, 'announced ' + match[1], chatId);
        if (!process.env.authorisedUsers.includes(chatId)) {
            bot.sendMessage(chatId, 'Sorry. You\'re not authorised to use this. Please contact @NFOResult if you require access.');
            return;
        }
        var resultsDate = dateUtil.getDateFromMessage(match[1]);
        await sendAnnouncedMessage(bot, chatId, resultsDate);
    });

    bot.onText(/[Cc]heck (.+)/, async (msg, match) => {
        var chatId = msg.chat.id;
        dbService.audit(BOT, 'check ' + match[1], chatId);
        if (!process.env.authorisedUsers.includes(chatId)) {
            bot.sendMessage(chatId, 'Sorry. You\'re not authorised to use this. Please contact @NFOResult if you require access.');
            return;
        }
        const interval = match[1];
        await resultsService.checkResults(bot, chatId, interval);
    });

    bot.onText(/[Hh]elp/, (msg, match) => {
        const chatId = msg.chat.id;
        dbService.audit(BOT, 'help ' + match[1], chatId);
        bot.sendMessage(chatId, GREETING);
    });

    bot.onText(/[Aa]tr (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        dbService.audit(BOT, 'atr ' + match[1], chatId);
        if (!process.env.authorisedUsers.includes(chatId)) {
            bot.sendMessage(chatId, 'Sorry. You\'re not authorised to use this. Please contact @NFOResult if you require access.');
            return;
        }
        const input = match[1].split(' ');
        const stockSymbol = input[0];
        var dateToCheck = dateUtil.getDateFromMessage(input[1]);
        await atrService.sendAtr(bot, chatId, stockSymbol, dateToCheck);
    });

}

async function sendAnnouncedMessage(bot, chatId, dateToCheck) {
    var sql = `select * from fno_results where DATE(result_time) = DATE('${dateUtil.formatTodayDate(dateToCheck)}') order by result_time`;
    var results = await dbService.runSql(sql);
    if (results && results.length > 0) {
        var message = '';
        results.forEach(result => {
            var resultDate = new Date(result.result_time);
            message += resultsService.createAnnouncedMessage(result.scrip_name, resultDate, null) + '\n';
        });
        bot.sendMessage(chatId, message, { parse_mode: 'markdown' });
    } else {
        bot.sendMessage(chatId, 'No results on ' + dateUtil.formatDate(dateToCheck));
    }
}

module.exports = {
    startBot
}