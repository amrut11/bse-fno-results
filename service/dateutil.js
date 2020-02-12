var dateFormat = require('dateformat');

const IST_OFFSET = -5.5 * 60;
const SECONDS = 60 * 1000;

const TWENTY_FOUR_HOURS = 24 * 60 * SECONDS;

function getDate() {
    return convertToIST(new Date());
}

function getYesterdayDate() {
    var date = getDate();
    date.setTime(date.getTime() - TWENTY_FOUR_HOURS);
    return date;
}

function getTomorrowDate() {
    var date = getDate();
    date.setTime(date.getTime() + TWENTY_FOUR_HOURS);
    return date;
}

function convertToIST(date) {
    var convertOffset = date.getTimezoneOffset() - IST_OFFSET;
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

function getDateFromMessage(dateToCheck) {
    var resultsDate;
    if (dateToCheck === 'today') {
        resultsDate = getDate();
    } else if (dateToCheck === 'yesterday') {
        resultsDate = getYesterdayDate();
    } else if (dateToCheck === 'tomorrow') {
        resultsDate = getTomorrowDate();
    } else {
        resultsDate = new Date(dateToCheck);
    }
    return resultsDate;
}

module.exports = {
    getDate, getYesterdayDate, getTomorrowDate, convertToIST, formatDate, formatTodayDate, formatTimeDate, isSameDate, getDateFromMessage
}