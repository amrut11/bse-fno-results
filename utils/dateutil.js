var dateFormat = require('dateformat');

const IST_OFFSET = -5.5 * 60;
const SECONDS = 60 * 1000;

function getDate() {
    return convertToIST(new Date());
}

function convertToIST(date) {
    var convertOffset = IST_OFFSET - date.getTimezoneOffset();
    console.dir(date.getTimezoneOffset());
    return new Date(date.getTime() + convertOffset * SECONDS);
}

function formatDate(date) {
    return dateFormat(date, 'dd mmm yyyy');
}

function formatTodayDate(date) {
    return dateFormat(date, 'yyyymmdd');
}

function formatTimeDate(date) {
    return dateFormat(date, 'dd mmmm yyyy HH:MM:ss:l');
}

function isSameDate(date1, date2) {
    return date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear();
}

module.exports = {
    getDate, convertToIST, formatDate, formatTodayDate, formatTimeDate, isSameDate
}