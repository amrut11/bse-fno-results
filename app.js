const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const sendMessage = require('./send-message');

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';

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

    // Matches "/echo [whatever]"
    bot.onText(/\/register/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "Registered successfully.");
    });

    bot.onText(/\/unregister/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, "Unregistered successfully.");
    });

    // Listen for any kind of message. There are different kinds of
    // messages.
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, 'Invlaid input');
    });

});