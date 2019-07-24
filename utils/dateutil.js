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

module.exports = {
    getDate, formatDate, formatTodayDate, formatTimeDate
}