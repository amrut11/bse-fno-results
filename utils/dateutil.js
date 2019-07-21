const FIVE_AND_HALF_HOURS = 5.5 * 60 * 60 * 1000;

function getDate() {
    var date = new Date();
    date.setTime(date.getTime() + FIVE_AND_HALF_HOURS);
    return date;
}

module.exports = {
    getDate
}