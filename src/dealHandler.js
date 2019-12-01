const Composer = require('telegraf/composer')
const queue = require('./queue')
const config = require('./config')
const hears = require('./hear')
const helpers = require('./helpers')
const Setting = require('./model/Setting')
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
  // const regex = /(\d+)(خ|ف)(\d+)(ا|ف|پس|)/
  const regex = /(\d+)(خ|ف)(\d+)(ا|ف|)/
  if (!regex.test(l)) return false
  var match = regex.exec(l)
  return {
    price: (() => {
      var q = `${Setting.getQuotation()}`
      var pr = match[1]
      var final = ''
      while (q.length > pr.length) {
        final += q[0]
        q = q.slice(1)
      }
      final += pr
      return +final
    })(),
    isSell: match[2] == 'ف',
    amount: +match[3],
    due: (() => {
      switch (match[4]) {
        case 'ا':
          return 0
        case 'ف':
          return 1
        // case 'پس':
        //   return 2
        case '':
          // return isTimeBetween() ? 0 : 1
          return 0
      }
    })()
  }
}

handler.hears(
  /\d+\s*(ف|خ)\s*\d+/,
  // async (ctx, next) => {
  //   if (
  //     ctx.user.role == config.role_admin ||
  //     ctx.user.role == config.role_owner
  //   ) {
  //     try {
  //       ctx.deleteMessage()
  //     } catch (error) {
  //       //
  //     }
  //   }
  //   next()
  // },
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
  // async (ctx, next) => {
  //   if (
  //     ctx.user.role == config.role_owner ||
  //     ctx.user.role == config.role_admin
  //   ) {
  //     try {
  //       ctx.deleteMessage()
  //     } catch (error) {
  //       //
  //     }
  //   }
  //   next()
  // },
  hears.offerByAmount
)

handler.hears(
  /^ب$/,
  (ctx,next) => {
    if (helpers.isReply(ctx)) next()
  },
  async ctx => {
    let bill = await Bill.findOne({
      messageId: ctx.message.reply_to_message.message_id
    })

    console.log('offer by amount')

    if (bill == undefined || bill.closed || bill.expired) {
      // faker.forceDeal(ctx.message.reply_to_message.message_id)
      return
    }
    let amount = bill.amount
    // if (bill.sellAsWhole && bill.amount != amount) return
    // if (!bill.sellAsWhole && bill.amount < amount) return

    let mx = await helpers.maxCanSell(ctx)
    let mcb = await helpers.maxCanBuy(ctx)
    // let bc = await ctx.setting.getBaseCharge()
    let bc =
      ctx.user.config.baseCharge == -1
        ? ctx.setting.getBaseCharge()
        : ctx.user.config.baseCharge

    let isSell = !bill.isSell
    // if (ctx.user.role == config.role_owner) {
    //     ctx.deleteMessage()
    // }

    if (ctx.user.charge < bc) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'موجودی حساب شما کمتر از وجه تضمین است'
      )
    }
    if (!isSell && amount > mcb) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'شما به حد اکثر میزان توانایی خرید خود رسیده اید\n اکانت خود را شارژ کرده'
      )
    }
    if (isSell && amount > mx) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'شما به حد اکثر میزان توانایی فروش خود رسیده اید\n اکانت خود را شارژ کرده'
      )
    }
    if (!helpers.isComplete(ctx)) {
      return ctx.telegram.sendMessage(
        ctx.message.from.id,
        'لطفا ابتدا حساب خود را تکمیل نمایید'
      )
    }

    let price = bill.price
    // let type = bill.type
    let due = bill.due
    let sellerId, buyerId
    if (isSell) {
      sellerId = ctx.user.userId
      buyerId = bill.userId
    } else {
      buyerId = ctx.user.userId
      sellerId = bill.userId
    }

    ctx.values = {
      isSell,
      sellerId,
      buyerId,
      amount,
      price,
      bill,
      // type,
      due
    }

    helpers.makeDeal(ctx)
  }
)

var midlware = handler.middleware()

var pushToHandler = ctx => {
  queue.push(() => {
    midlware(ctx)
  })
}

module.exports = handler
module.exports.pushToHandler = pushToHandler
