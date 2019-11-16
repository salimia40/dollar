const Composer = require('telegraf/composer')
const queue = require('./queue')
const config = require('./config')
const hears = require('./hear')
const helpers = require('./helpers')
const moment = require('moment')

const handler = new Composer()

isTimeBetween = function(aStartTime = '00:00', anEndTime = '12:30', aCurrTime) {
  // you may pass in aCurrTime or use the *actual* current time
  var currentTime = !aCurrTime ? moment() : moment(aCurrTime, 'HH:mm a')
  var startTime = moment(aStartTime, 'HH:mm a')
  var endTime = moment(anEndTime, 'HH:mm a')

  if (startTime.hour() >= 12 && endTime.hour() <= 12) {
    endTime.add(1, 'days') // handle spanning days
  }

  return currentTime.isBetween(startTime, endTime)
}

const parsLafz = l => {
  l = l.replace(/\s/, '')
  // const regex = /(ا|ف|پس|)(\d+)(خ|ف)(\d+)(ب|پ|)/
  const regex = /(\d+)(خ|ف)(\d+)(ا|ف|پس|)/
  if (!regex.test(l)) return false
  var match = regex.exec(l)
  return {
    price: +match[1],
    isSell: match[2] == 'ف',
    amount: +match[3],
    due: (() => {
      switch (match[4]) {
        case 'ا':
          return 0
        case 'ف':
          return 1
        case 'پس':
          return 2
        case '':
          return isTimeBetween() ? 0 : 1
      }
    })()
  }
}

handler.hears(
  /\d+\s*(ف|خ)\s*\d+/,
  async (ctx, next) => {
    if (
      ctx.user.role == config.role_admin ||
      ctx.user.role == config.role_owner
    ) {
      try {
        ctx.deleteMessage()
      } catch (error) {
        //
      }
    }
    next()
  },
  async (ctx, next) => {
    var l = parsLafz(ctx.match.input)
    console.log(l)
    if (l) {
      ctx.lafz = l
      next()
    }
  },
  hears.validateOffer,
  hears.prossessOffer,
  helpers.makeDeal
)

handler.hears(
  /^\d+$/,
  async (ctx, next) => {
    if (
      ctx.user.role == config.role_owner ||
      ctx.user.role == config.role_admin
    ) {
      try {
        ctx.deleteMessage()
      } catch (error) {
        //
      }
    }
    next()
  },
  hears.offerByAmount
)

var midlware = handler.middleware()

var pushToHandler = ctx => {
  queue.push(() => {
    midlware(ctx)
  })
}

module.exports = handler
module.exports.pushToHandler = pushToHandler
