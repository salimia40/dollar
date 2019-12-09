const Scene = require('telegraf/scenes/base')
const Transaction = require('../model/Transaction')
const { leave } = require('telegraf/stage')
const User = require('../model/User')
const Bill = require('../model/Bill')
const helpers = require('../helpers')
const queue = require('../queue')
const config = require('../config')
const Markup = require('telegraf/markup')

const scene = new Scene('viewUserScene')
scene.enter(ctx => {
  ctx.reply(
    'لطفا کد کاربری مربوط به کاربر مورد نظر را وارد کنید',
    Markup.inlineKeyboard([[{ text: 'انصراف', callback_data: 'cancel' }]])
      .resize()
      .extra()
  )
})

scene.action(
  'cancel',
  (ctx, next) => {
    ctx.deleteMessage()
    next()
  },
  leave()
)

scene.hears(
  /\d+/,
  async (ctx, next) => {
    var c = ctx.match[0]
    c = +c
    var user = await User.findOne({ userId: c })

    if (user == undefined) {
      ctx.reply('کاربر یافت نشد')
    } else {
      var msg = await helpers.userToStringByUser(user)

      let bills = await Bill.find({
        userId: user.userId,
        closed: true,
        left: {
          $gt: 0
        }
      })

      var tot0 = 0
      var tot1 = 0
      while (bills.length > 0) {
        var b = bills.pop()
        if (b.due == 0) {
          if (b.isSell) tot0 += b.left
          else tot0 -= b.left
        } else {
          if (b.isSell) tot1 += b.left
          else tot1 -= b.left
        }
      }

      msg += ` موجودی ${tot0 > 0 ? 'فروش' : 'خرید'} امروزی: ${Math.abs(tot0)}
موجودی ${tot1 > 0 ? 'فروش' : 'خرید'} فردایی: ${Math.abs(tot1)}
موجودی آزاد خرید: ${await helpers.maxCanBuy(ctx)}
موجودی آزاد فروش: ${await helpers.maxCanSell(ctx)}
  `
      await ctx.reply(msg)
    }
    next()
  },
  leave()
)

scene.hears('خروج', leave())

module.exports = scene
