const moment = require('moment-timezone')
const persianDate = require('persian-date')
persianDate.toLocale('fa')
persianDate.toLeapYearMode('algorithmic')

const dateToString = (date) => {
    console.log(date)
    if (date == undefined) return ''
    var m = moment(moment.unix(date / 1000).tz('Asia/Tehran').format('DD/MM/YYYY HH:mm'),'DD/MM/YYYY hh:mm')
    return new persianDate(+m).format('dddd YYYY/MM/DD HH:mm')
}

module.exports.dateToString = dateToString