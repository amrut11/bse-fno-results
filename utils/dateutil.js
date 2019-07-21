const FIVE_AND_HALF_HOURS = 5.5 * 60 * 60 * 1000;

function getDate() {
    var date = new Date();
    var offset = date.getTimezoneOffset();
    if (offset == 0) {
        date.setTime(date.getTime() + FIVE_AND_HALF_HOURS);
    }
    return date;
}

function formatTodayDate(date) {
    var month = date.getMonth();
    var day = date.getDate();
    return date.getFullYear() + '' + (month < 10 ? '0' + month : month) + '' + (day < 10 ? '0' + day : day);
}

function formatDate(date) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return day + ' ' + monthNames[monthIndex] + ' ' + year;
}

module.exports = {
    getDate, formatDate, formatTodayDate
}