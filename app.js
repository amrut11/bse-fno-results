const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';
const channelChatId = '-1001453070196';

const port = process.env.PORT || 3000
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Started bot successfully</h1>');
});
server.listen(port, () => {
    console.log(`Server running at port ` + port);
    // Create a bot that uses 'polling' to fetch new updates
    const bot = new TelegramBot(token, { polling: true });

    bot.on('message', (msg) => {
        const text = msg.text;
        bot.sendMessage(channelChatId, text);
    });

});