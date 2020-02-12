const reqHelper = require('./request-helper');
const dateUtil = require('./dateutil');

async function sendAtr(bot, chatId, stockSymbol, dateToCheck) {
    var atrUrl = process.env.atrApi.replace('{symbol}', stockSymbol).replace('{alphavantageKey}', process.env.alphavantageKey);
    var response = await reqHelper.downloadPage(atrUrl, true);
    var atrJson = response['Technical Analysis: ATR'];
    if (atrJson) {
        for (var k in atrJson) {
            var atrDate = new Date(k);
            if (dateUtil.isSameDate(atrDate, dateToCheck)) {
                var message = 'ATR for ' + stockSymbol + ' as of ' + k + ' is ' + atrJson[k].ATR;
                bot.sendMessage(chatId, message);
                return;
            }
        }
    }
    bot.sendMessage(chatId, 'No data found');
}

module.exports = {
    sendAtr
}