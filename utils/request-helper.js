const request = require('request');

async function downloadPage(url, parse) {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode != 200) {
                reject('Invalid status code <' + response.statusCode + '>');
            }
            resolve(parse ? JSON.parse(body) : body);
        });
    });
}

module.exports = {
    downloadPage
};