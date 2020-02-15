const dbService = require('../service/db-service');
const dateUtil = require('../service/dateutil');
const requestHelper = require('../service/request-helper');

const HTTP = 'HTTP';

async function checkResults(bot, chatId, interval) {
    dbService.audit(HTTP, 'checkResult', null);
    var todayDate = dateUtil.getDate();
    var todayDateFormatted = dateUtil.formatTodayDate(todayDate);
    var resultsApi = process.env.bseResultsApi.replace('{startDate}', todayDateFormatted).replace('{endDate}', todayDateFormatted);
    var currentResults = await requestHelper.downloadPage(resultsApi, true);
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
            var options = {
                reply_markup: JSON.stringify({
                    inline_keyboard: [
                        [{ text: 'Company Announcement', url: process.env.bseAttachUrl + result.ATTACHMENTNAME }]
                    ]
                }),
                parse_mode: 'markdown'
            };
            bot.sendMessage(chatId, message, options);
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
        resultNews = resultNews.replace(/'/g, '"');
        var sql = `insert into fno_results values ('${scripId}', '${scripName}', to_timestamp(${resultTime / 1000}), '${resultNews}', to_timestamp(${now}))`;
        await dbService.runSql(sql);
    }
    return resultExists;
}

async function checkResultExists(scripId, resultTime) {
    var sql = `select scrip_id from fno_results where scrip_id = '${scripId}' and result_time = to_timestamp(${resultTime / 1000})`;
    var result = await dbService.runSql(sql);
    return result && result.length > 0;
}

function createAnnouncedMessage(scripName, resultDate, resultNews) {
    var message = '';
    if (resultNews) {
        message += '*Results out!*\n----------------------\n';
    }
    message += '*Stock*: *' + scripName + '*\n*Time*: ' + dateUtil.formatTimeDate(resultDate);
    if (resultNews) {
        message += '\n*News*: ' + resultNews
    }
    return message;
}

async function sendResultsMessage(bot, chatId, dateToCheck) {
    dbService.audit(HTTP, 'todayResults', null);
    var results = await requestHelper.downloadPage(process.env.fnoResultsUrl, true);
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var resultsDate = new Date(result.date);
        if (dateUtil.isSameDate(resultsDate, dateToCheck)) {
            var message = createDailyResultMessage(result);
            bot.sendMessage(chatId, message, { parse_mode: 'markdown' });
            return;
        }
    }
    bot.sendMessage(chatId, 'No results on ' + dateUtil.formatDate(dateToCheck));
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

module.exports = {
    checkResults, createAnnouncedMessage, sendResultsMessage
}