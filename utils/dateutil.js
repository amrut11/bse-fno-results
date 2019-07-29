var dateFormat = require('dateformat');

const FIVE_AND_HALF_HOURS = 5.5 * 60 * 60 * 1000;

function getDate() {
    var date = new Date();
    var offset = date.getTimezoneOffset();
    if (offset == 0) {
        date.setTime(date.getTime() + FIVE_AND_HALF_HOURS);
    }
    return date;
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
    getDate, formatDate, formatTodayDate, formatTimeDate, isSameDate
}