const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const token = '923352008:AAGigsiG3IApxMLmsb8M_PGRlvT757IhBuk';

const port = process.env.PORT || 3000
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Hello World</h1><br><h2>Hello World, but smaller</h2><br><br><p>Smallest hello world</p>');
});
server.listen(port, () => {
    console.log(`Server running at port ` + port);
    // Create a bot that uses 'polling' to fetch new updates
    const bot = new TelegramBot(token, { polling: true });

    // Matches "/echo [whatever]"
    bot.onText(/\/echo (.+)/, (msg, match) => {
        // 'msg' is the received Message from Telegram
        // 'match' is the result of executing the regexp above on the text content
        // of the message

        const chatId = msg.chat.id;
        const resp = match[1]; // the captured "whatever"

        // send back the matched "whatever" to the chat
        bot.sendMessage(chatId, resp);
    });

    // Listen for any kind of message. There are different kinds of
    // messages.
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;

        // send a message to the chat acknowledging receipt of their message
        bot.sendMessage(chatId, 'Received your message, dude.');
    });

});