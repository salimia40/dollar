const moment = require('moment')

isTimeBetween = function(aStartTime = '00:00', anEndTime = '12:30', aCurrTime) {
  // you may pass in aCurrTime or use the *actual* current time
  var currentTime = !aCurrTime ? moment() : moment(aCurrTime, 'HH:mm a')
  var startTime = moment(aStartTime, 'HH:mm a')
  var endTime = moment(anEndTime, 'HH:mm a')

  if (startTime.hour() >= 12 && endTime.hour() <= 12) {
    endTime.add(1, 'days') // handle spanning days
  }

  var isBetween = currentTime.isBetween(startTime, endTime)

  /***  testing   
    startTimeString = startTime.toString();
    endTimeString = endTime.toString();
    currentTimeString = currentTime.toString();

    console.log(startTimeString);
    console.log(endTimeString);
    console.log(currentTimeString);
    console.log('\nis '+ currentTimeString  + ' between ' + 
              startTimeString + ' and ' + endTimeString + ' : ' 
              + isBetween);
    ****/
  return isBetween
}

// console.log(isTimeBetween('12:00'))

const relence = () => {
  var q = `14300`
  var pr = '23700'
  // if (q.length == pr.length) return +pr
  var final = ''
  while (q.length > pr.length) {
    final += q[0]
    q = q.slice(1)
  }
  final += pr
  return +final
}

console.log(relence())
